"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { DecisionPanel, FinalEvaluation } from "@/domain/interview";
import { INTERVIEW_POLICY } from "@/domain/interviewPolicy";
import { INTERVIEW_UI } from "@/config/interviewUi";
import type { ClientSession, ClientTurn } from "@/lib/serializers";
import { useQuestionStream, type StreamDonePayload } from "./useQuestionStream";
import { useVoiceCapture, type VoiceRecording } from "./useVoiceCapture";

const TIME_LIMIT = INTERVIEW_POLICY.ANSWER_TIME_LIMIT_SEC;

type Phase =
  | "starting"
  | "ready"
  | "recording"
  | "streaming"
  | "completed"
  | "error";

interface State {
  phase: Phase;
  sessionId: string | null;
  interviewerName: string;
  jobTitle: string;
  jobDescription: string;
  turnIndex: number;
  turns: ClientTurn[];
  streamingText: string;
  panel: DecisionPanel | null;
  finalEvaluation: FinalEvaluation | null;
  secondsLeft: number;
  captureNotice: string | null;
  submitError: string | null;
  pendingTranscript: string | null;
  error: string | null;
}

type Action =
  | { type: "START_SUCCESS"; session: ClientSession }
  | { type: "START_ERROR"; message: string }
  | { type: "BEGIN_RECORDING" }
  | { type: "TICK" }
  | { type: "CAPTURE_FAILED"; notice: string }
  | { type: "STREAM_START"; transcript: string }
  | { type: "QUESTION_TOKEN"; value: string }
  | { type: "DONE"; payload: StreamDonePayload }
  | { type: "SUBMIT_ERROR"; message: string };

const initialState: State = {
  phase: "starting",
  sessionId: null,
  interviewerName: "Interviewer",
  jobTitle: "",
  jobDescription: "",
  turnIndex: 0,
  turns: [],
  streamingText: "",
  panel: null,
  finalEvaluation: null,
  secondsLeft: TIME_LIMIT,
  captureNotice: null,
  submitError: null,
  pendingTranscript: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_SUCCESS": {
      const pendingTurn =
        action.session.turns.find((turn) => turn.decision === null) ??
        action.session.turns.at(-1) ??
        null;

      return {
        ...state,
        phase:
          action.session.status === "completed" ? "completed" : "ready",
        sessionId: action.session.id,
        interviewerName: action.session.interviewerName,
        jobTitle: action.session.jobTitle,
        jobDescription: action.session.jobDescription,
        turnIndex: pendingTurn?.index ?? 0,
        turns: action.session.turns,
        panel: action.session.panel,
        finalEvaluation: action.session.finalEvaluation,
        error: null,
      };
    }
    case "START_ERROR":
      return { ...state, phase: "error", error: action.message };
    case "BEGIN_RECORDING":
      return {
        ...state,
        phase: "recording",
        secondsLeft: TIME_LIMIT,
        captureNotice: null,
        submitError: null,
      };
    case "TICK":
      return { ...state, secondsLeft: Math.max(0, state.secondsLeft - 1) };
    case "CAPTURE_FAILED":
      return {
        ...state,
        phase: "ready",
        captureNotice: action.notice,
      };
    case "STREAM_START":
      return {
        ...state,
        phase: "streaming",
        streamingText: "",
        captureNotice: null,
        submitError: null,
        pendingTranscript: action.transcript,
        turns: state.turns.map((turn) =>
          turn.index === state.turnIndex
            ? { ...turn, answerTranscript: action.transcript }
            : turn,
        ),
      };
    case "QUESTION_TOKEN":
      return {
        ...state,
        streamingText: state.streamingText + action.value,
      };
    case "DONE": {
      const answeredTurns = state.turns.map((turn) =>
        turn.index === state.turnIndex
          ? {
              ...turn,
              answerTranscript: state.pendingTranscript,
              decision: action.payload.decision,
            }
          : turn,
      );

      if (action.payload.completed) {
        return {
          ...state,
          phase: "completed",
          panel: action.payload.panel,
          turns: answeredTurns,
          finalEvaluation: action.payload.finalEvaluation,
          pendingTranscript: null,
          streamingText: "",
        };
      }

      const nextTurn = action.payload.nextTurn
        ? {
            index: action.payload.nextTurn.index,
            questionText: action.payload.nextTurn.questionText,
            questionType: action.payload.nextTurn.questionType,
            answerTranscript: null,
            decision: null,
            createdAt: action.payload.nextTurn.createdAt,
          }
        : null;

      return {
        ...state,
        phase: "ready",
        panel: action.payload.panel,
        turnIndex: nextTurn?.index ?? state.turnIndex,
        turns:
          nextTurn &&
          !answeredTurns.some((turn) => turn.index === nextTurn.index)
            ? [...answeredTurns, nextTurn]
            : answeredTurns,
        pendingTranscript: null,
        streamingText: "",
      };
    }
    case "SUBMIT_ERROR":
      return {
        ...state,
        phase: "ready",
        submitError: action.message,
      };
    default:
      return state;
  }
}

function readActiveSession(jobId: string): string | null {
  try {
    const raw = window.localStorage.getItem(
      INTERVIEW_UI.ACTIVE_SESSION_STORAGE_KEY,
    );
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { jobId?: string; sessionId?: string };
    if (parsed.jobId !== jobId || typeof parsed.sessionId !== "string") {
      return null;
    }

    return parsed.sessionId;
  } catch {
    return null;
  }
}

function persistActiveSession(jobId: string, sessionId: string): void {
  window.localStorage.setItem(
    INTERVIEW_UI.ACTIVE_SESSION_STORAGE_KEY,
    JSON.stringify({
      jobId,
      sessionId,
      updatedAt: new Date().toISOString(),
    }),
  );
}

function clearActiveSession(sessionId: string | null): void {
  try {
    const raw = window.localStorage.getItem(
      INTERVIEW_UI.ACTIVE_SESSION_STORAGE_KEY,
    );
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as { sessionId?: string };
    if (!sessionId || parsed.sessionId === sessionId) {
      window.localStorage.removeItem(INTERVIEW_UI.ACTIVE_SESSION_STORAGE_KEY);
    }
  } catch {
    window.localStorage.removeItem(INTERVIEW_UI.ACTIVE_SESSION_STORAGE_KEY);
  }
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const json = (await response.json()) as {
    success: boolean;
    data?: T;
    message?: string;
  };

  if (!json.success || !json.data) {
    throw new Error(json.message ?? "Unexpected request failure.");
  }

  return json.data;
}

export interface InterviewSession {
  phase: Phase;
  interviewerName: string;
  jobTitle: string;
  jobDescription: string;
  turns: ClientTurn[];
  streamingText: string;
  panel: DecisionPanel | null;
  finalEvaluation: FinalEvaluation | null;
  sessionId: string | null;
  secondsLeft: number;
  timeLimit: number;
  captureNotice: string | null;
  submitError: string | null;
  canRetrySubmit: boolean;
  error: string | null;
  audioByTurn: Record<number, VoiceRecording>;
  isRecording: boolean;
  volumeOk: boolean;
  level: number;
  interim: string;
  liveTranscript: string;
  voiceSupported: boolean;
  startRecording: () => Promise<void>;
  stopAndSubmit: () => Promise<void>;
  retrySubmit: () => Promise<void>;
}

export function useInterviewSession(
  jobId: string,
  { enabled = true }: { enabled?: boolean } = {},
): InterviewSession {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [audioByTurn, setAudioByTurn] = useState<Record<number, VoiceRecording>>(
    {},
  );
  const voice = useVoiceCapture();
  const { streamAnswer } = useQuestionStream();
  const startedRef = useRef(false);
  const stopRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!enabled || startedRef.current) {
      return;
    }

    startedRef.current = true;
    let cancelled = false;

    const start = async () => {
      try {
        const activeSessionId = readActiveSession(jobId);

        if (activeSessionId) {
          const resumed = await fetchJson<ClientSession>(
            `/api/sessions/${activeSessionId}`,
          );

          if (!cancelled && resumed.status === "in_progress") {
            persistActiveSession(jobId, resumed.id);
            dispatch({ type: "START_SUCCESS", session: resumed });
            return;
          }

          clearActiveSession(activeSessionId);
        }

        const created = await fetchJson<ClientSession>("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });

        if (!cancelled) {
          persistActiveSession(jobId, created.id);
          dispatch({ type: "START_SUCCESS", session: created });
        }
      } catch (error) {
        if (!cancelled) {
          dispatch({
            type: "START_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Could not start the interview.",
          });
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [enabled, jobId]);

  useEffect(() => {
    if (state.sessionId && state.phase !== "completed" && state.phase !== "error") {
      persistActiveSession(jobId, state.sessionId);
    }

    if (state.phase === "completed" || state.phase === "error") {
      clearActiveSession(state.sessionId);
    }
  }, [jobId, state.phase, state.sessionId]);

  const submit = useCallback(
    async (transcript: string) => {
      if (!state.sessionId) {
        return;
      }

      dispatch({ type: "STREAM_START", transcript });

      await streamAnswer(
        state.sessionId,
        { turnIndex: state.turnIndex, transcript },
        {
          onToken: (value) => dispatch({ type: "QUESTION_TOKEN", value }),
          onDone: (payload) => dispatch({ type: "DONE", payload }),
          onError: (message) => dispatch({ type: "SUBMIT_ERROR", message }),
        },
      );
    },
    [state.sessionId, state.turnIndex, streamAnswer],
  );

  const startRecording = useCallback(async () => {
    if (state.phase !== "ready") {
      return;
    }

    dispatch({ type: "BEGIN_RECORDING" });
    const result = await voice.start();

    if (!result.ok) {
      dispatch({ type: "CAPTURE_FAILED", notice: result.message });
    }
  }, [state.phase, voice]);

  const stopAndSubmit = useCallback(async () => {
    if (state.phase !== "recording") {
      return;
    }

    voice.stop();
    await new Promise((resolve) =>
      setTimeout(resolve, INTERVIEW_UI.TRANSCRIPT_FLUSH_DELAY_MS),
    );

    const transcript = voice.getTranscript().trim();
    const recording = await voice.takeRecording();

    if (!voice.volumeOk || transcript.length === 0) {
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      voice.reset();
      dispatch({
        type: "CAPTURE_FAILED",
        notice:
          "We could not capture a clear answer. Please record the response again.",
      });
      return;
    }

    if (recording) {
      setAudioByTurn((current) => ({
        ...current,
        [state.turnIndex]: recording,
      }));
    }

    await submit(transcript);
    voice.reset();
  }, [state.phase, state.turnIndex, submit, voice]);

  stopRef.current = stopAndSubmit;

  const retrySubmit = useCallback(async () => {
    if (state.phase === "streaming" || !state.pendingTranscript) {
      return;
    }

    await submit(state.pendingTranscript);
  }, [state.pendingTranscript, state.phase, submit]);

  useEffect(() => {
    if (state.phase !== "recording") {
      return;
    }

    const intervalId = window.setInterval(
      () => dispatch({ type: "TICK" }),
      1000,
    );

    return () => window.clearInterval(intervalId);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "recording" && state.secondsLeft <= 0) {
      void stopRef.current?.();
    }
  }, [state.phase, state.secondsLeft]);

  useEffect(
    () => () => {
      Object.values(audioByTurn).forEach((recording) => {
        URL.revokeObjectURL(recording.url);
      });
    },
    [audioByTurn],
  );

  return {
    phase: state.phase,
    interviewerName: state.interviewerName,
    jobTitle: state.jobTitle,
    jobDescription: state.jobDescription,
    turns: state.turns,
    streamingText: state.streamingText,
    panel: state.panel,
    finalEvaluation: state.finalEvaluation,
    sessionId: state.sessionId,
    secondsLeft: state.secondsLeft,
    timeLimit: TIME_LIMIT,
    captureNotice: state.captureNotice,
    submitError: state.submitError,
    canRetrySubmit: state.pendingTranscript !== null,
    error: state.error,
    audioByTurn,
    isRecording: voice.isRecording,
    volumeOk: voice.volumeOk,
    level: voice.level,
    interim: voice.interim,
    liveTranscript: voice.transcript,
    voiceSupported: voice.supported,
    startRecording,
    stopAndSubmit,
    retrySubmit,
  };
}
