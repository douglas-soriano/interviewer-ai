"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CircleNotch,
  Microphone,
  MicrophoneSlash,
} from "@phosphor-icons/react";
import type { Decision, DecisionPanel } from "@/domain/interview";
import type { BankQuestion, Dimension, JobSkill } from "@/domain/interview";
import { INTERVIEW_POLICY } from "@/domain/interviewPolicy";
import { INTERVIEW_UI } from "@/config/interviewUi";
import { useMicPermission } from "@/hooks/useMicPermission";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import type { VoiceRecording } from "@/hooks/useVoiceCapture";
import type { ClientTurn } from "@/lib/serializers";
import { InterviewChat } from "./InterviewChat";
import { InterviewHeader } from "./InterviewHeader";
import { InterviewSidebar } from "./InterviewSidebar";
import { RecordButton } from "./RecordButton";

const PREPARING_DELAY_MS = 650;
const THINKING_DELAY_MS = 950;
const TIME_LIMIT = INTERVIEW_POLICY.ANSWER_TIME_LIMIT_SEC;

const LOCAL_PROMPTS: Array<{
  questionText: string;
  questionType: ClientTurn["questionType"];
}> = [
  {
    questionText:
      "How did you bring other teams along when the system behavior changed?",
    questionType: "follow_up",
  },
  {
    questionText:
      "Describe a technical trade-off you would make differently today.",
    questionType: "topic_shift",
  },
  {
    questionText:
      "What signal would make you confident this system is healthy in production?",
    questionType: "follow_up",
  },
  {
    questionText:
      "Before we wrap, what part of your experience should I understand better?",
    questionType: "closing",
  },
];

function Notice({
  tone,
  children,
}: {
  tone: "warning" | "danger";
  children: ReactNode;
}) {
  const className =
    tone === "danger"
      ? "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#a6302d]"
      : "border-[#ffe0bd] bg-[var(--warning-soft)] text-[#9d570d]";

  return (
    <div className={`rounded-[12px] border px-4 py-3 text-sm leading-6 ${className}`}>
      {children}
    </div>
  );
}

function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[calc(100dvh-var(--interview-header-height))] max-w-md place-items-center px-6 text-center">
      <div className="w-full">{children}</div>
    </main>
  );
}

function PreparingScreen({ micGranted }: { micGranted: boolean }) {
  const steps = [
    { label: "Microphone access", done: micGranted, active: !micGranted },
    {
      label: "Preparing your first question",
      done: false,
      active: micGranted,
    },
  ];

  return (
    <CenteredScreen>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Microphone size={24} aria-hidden />
      </div>
      <h1 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
        Setting up your interview
      </h1>
      <ul
        className="mx-auto mt-6 flex max-w-[300px] flex-col gap-3 text-left"
        aria-live="polite"
      >
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            {step.done ? (
              <CheckCircle
                size={20}
                weight="fill"
                className="shrink-0 text-[var(--success)]"
                aria-hidden
              />
            ) : step.active ? (
              <CircleNotch
                size={20}
                className="shrink-0 animate-spin text-[var(--primary)]"
                aria-hidden
              />
            ) : (
              <span
                className="h-5 w-5 shrink-0 rounded-full border-2 border-[var(--border-strong)]"
                aria-hidden
              />
            )}
            <span
              className={
                step.done || step.active
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </CenteredScreen>
  );
}

function MicDeniedScreen({
  onRetry,
  onLeave,
}: {
  onRetry: () => void;
  onLeave: () => void;
}) {
  return (
    <CenteredScreen>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--danger-soft)] text-[#d83c39]">
        <MicrophoneSlash size={24} aria-hidden />
      </div>
      <h1 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
        Microphone access is required
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        This voice interview cannot start without your microphone. Allow access
        in the browser and try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[9px] bg-[image:var(--gradient-button)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-button)]"
        >
          Allow microphone
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-[9px] border border-[#e1e4ef] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[#fafaff]"
        >
          Back to roles
        </button>
      </div>
    </CenteredScreen>
  );
}

function makeLocalDecision(nextPrompt: {
  questionText: string;
  questionType: ClientTurn["questionType"];
}): Decision {
  return {
    nextQuestion: nextPrompt.questionText,
    questionType: nextPrompt.questionType,
    questionSource: "generated",
    signals: [
      {
        criterionId: "be-communication",
        dimension: "ownership",
        polarity: "positive",
        strength: 0.58,
        evidence: "The answer was captured locally and is ready for review.",
      },
    ],
    reasoning:
      "This local interview flow accepted the answer and queued the next prompt.",
    guardrail: null,
    shouldEnd: false,
  };
}

function mapCategoryToQuestionType(
  category: BankQuestion["category"],
): ClientTurn["questionType"] {
  switch (category) {
    case "ownership":
      return "follow_up";
    case "culture":
      return "topic_shift";
    case "red_flag":
      return "redirect";
    default:
      return "topic_shift";
  }
}

function nextPromptFor(turnCount: number, questions: BankQuestion[]) {
  const bankQuestion = questions[turnCount];
  if (bankQuestion) {
    return {
      questionText: bankQuestion.text,
      questionType: mapCategoryToQuestionType(bankQuestion.category),
    };
  }

  return LOCAL_PROMPTS[turnCount % LOCAL_PROMPTS.length];
}

function buildOpeningTurn(questions: BankQuestion[]): ClientTurn {
  const openingQuestion = questions[0];

  return {
    index: 0,
    questionText:
      openingQuestion?.text ??
      "Tell me about a project that best represents how you work.",
    questionType: "opening",
    answerTranscript: null,
    decision: null,
    createdAt: new Date().toISOString(),
  };
}

function buildPanel(skills: JobSkill[], turns: ClientTurn[]): DecisionPanel {
  const answeredCount = turns.filter((turn) => turn.answerTranscript !== null).length;
  const skillStates = skills.map((skill, index) => {
    const demonstrated = index < Math.max(0, answeredCount - 1);
    const partial = !demonstrated && index < answeredCount;

    return {
      skillId: skill.id,
      label: skill.label,
      tier: skill.tier,
      dimension: skill.dimension,
      status: demonstrated
        ? "demonstrated"
        : partial
          ? "partial"
          : "gap",
      strength: demonstrated ? 0.78 : partial ? 0.48 : 0,
    } as const;
  });

  const dimensions: DecisionPanel["dimensions"] = ([
    "technical",
    "ownership",
    "culture",
  ] as const satisfies readonly Dimension[]).map((dimension) => {
    const matches = skillStates.filter((skill) => skill.dimension === dimension);
    const positives = matches.filter((skill) => skill.status === "demonstrated")
      .length;
    const partials = matches.filter((skill) => skill.status === "partial").length;

    return {
      dimension,
      score: Math.min(100, positives * 28 + partials * 14),
      positives,
      redFlags: 0,
    };
  });

  return {
    dimensions,
    skills: skillStates,
    reasoning:
      answeredCount === 0
        ? "The interview has not collected any answer yet."
        : "This local session is tracking skill coverage until the real interview backend is connected.",
    lastGuardrail: null,
    questionsAsked: turns.length,
    followUps: turns.filter((turn) => turn.questionType === "follow_up").length,
  };
}

export function InterviewRoom({
  jobId,
  jobTitle,
  jobDescription,
  interviewerName,
  skills,
  questions,
}: {
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  interviewerName: string;
  skills: JobSkill[];
  questions: BankQuestion[];
}) {
  const router = useRouter();
  const mic = useMicPermission();
  const voice = useVoiceCapture();
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [turns, setTurns] = useState<ClientTurn[]>(() => [
    buildOpeningTurn(questions),
  ]);
  const [audioByTurn, setAudioByTurn] = useState<Record<number, VoiceRecording>>(
    {},
  );
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(TIME_LIMIT);
  const thinkingTimerRef = useRef<number | null>(null);
  const autoSubmittingRef = useRef(false);
  const audioByTurnRef = useRef(audioByTurn);

  audioByTurnRef.current = audioByTurn;

  useEffect(() => {
    if (mic.state !== "granted") {
      setPrepared(false);
      return;
    }

    const timer = window.setTimeout(() => setPrepared(true), PREPARING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [mic.state]);

  useEffect(
    () => () => {
      if (thinkingTimerRef.current !== null) {
        window.clearTimeout(thinkingTimerRef.current);
      }

      Object.values(audioByTurnRef.current).forEach((recording) => {
        URL.revokeObjectURL(recording.url);
      });
    },
    [],
  );

  useEffect(() => {
    if (mic.state !== "granted" || !prepared) return;

    window.localStorage.setItem(
      INTERVIEW_UI.ACTIVE_SESSION_STORAGE_KEY,
      JSON.stringify({
        jobId,
        updatedAt: new Date().toISOString(),
        mode: "local-draft",
      }),
    );
  }, [jobId, mic.state, prepared, turns]);

  const activeTurn = turns.find((turn) => !turn.answerTranscript) ?? null;
  const panel = useMemo<DecisionPanel>(() => buildPanel(skills, turns), [skills, turns]);

  const startRecording = useCallback(async () => {
    if (!activeTurn) {
      setCaptureNotice("The sample interview has no open question right now.");
      return;
    }

    setCaptureNotice(null);
    setSecondsLeft(TIME_LIMIT);
    autoSubmittingRef.current = false;

    const result = await voice.start();
    if (!result.ok) {
      setCaptureNotice(result.message);
    }
  }, [activeTurn, voice]);

  const appendNextQuestion = useCallback(() => {
    setTurns((currentTurns) => {
      if (currentTurns.some((turn) => !turn.answerTranscript)) {
        return currentTurns;
      }

      if (currentTurns.length >= INTERVIEW_POLICY.MAX_QUESTIONS) {
        return currentTurns;
      }

      const prompt = nextPromptFor(currentTurns.length, questions);
      return [
        ...currentTurns,
        {
          index: currentTurns.length,
          questionText: prompt.questionText,
          questionType: prompt.questionType,
          answerTranscript: null,
          decision: null,
          createdAt: new Date().toISOString(),
        },
      ];
    });

    setThinking(false);
  }, [questions]);

  const stopAndSubmit = useCallback(async () => {
    if (!voice.isRecording || !activeTurn) return;

    const turnIndex = activeTurn.index;
    voice.stop();

    const transcript = voice.getTranscript().trim();
    const recording = await voice.takeRecording();

    if (!voice.volumeOk || transcript.length < 3) {
      if (recording) URL.revokeObjectURL(recording.url);
      setCaptureNotice(
        "No clear speech was detected. Please record the answer again.",
      );
      voice.reset();
      setSecondsLeft(TIME_LIMIT);
      autoSubmittingRef.current = false;
      return;
    }

    const nextPrompt = nextPromptFor(turns.length, questions);
    const decision = makeLocalDecision(nextPrompt);

    setTurns((currentTurns) =>
      currentTurns.map((turn) =>
        turn.index === turnIndex
          ? {
              ...turn,
              answerTranscript: transcript,
              decision,
            }
          : turn,
      ),
    );

    if (recording) {
      setAudioByTurn((current) => {
        const existing = current[turnIndex];
        if (existing) URL.revokeObjectURL(existing.url);
        return { ...current, [turnIndex]: recording };
      });
    }

    voice.reset();
    setSecondsLeft(TIME_LIMIT);
    setCaptureNotice(null);
    setThinking(true);

    if (thinkingTimerRef.current !== null) {
      window.clearTimeout(thinkingTimerRef.current);
    }
    thinkingTimerRef.current = window.setTimeout(
      appendNextQuestion,
      THINKING_DELAY_MS,
    );
  }, [activeTurn, appendNextQuestion, questions, turns.length, voice]);

  useEffect(() => {
    if (!voice.isRecording) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          if (!autoSubmittingRef.current) {
            autoSubmittingRef.current = true;
            void stopAndSubmit();
          }
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [stopAndSubmit, voice.isRecording]);

  const leaveInterview = useCallback(() => {
    router.push("/");
  }, [router]);

  if (mic.state === "denied") {
    return (
      <div className="app-shell">
        <InterviewHeader
          jobTitle="Preparing interview"
          analyticsVisible={analyticsVisible}
          onAnalyticsChange={setAnalyticsVisible}
        />
        <MicDeniedScreen onRetry={mic.retry} onLeave={leaveInterview} />
      </div>
    );
  }

  if (mic.state === "checking" || !prepared) {
    return (
      <div className="app-shell">
        <InterviewHeader
          jobTitle="Preparing interview"
          analyticsVisible={analyticsVisible}
          onAnalyticsChange={setAnalyticsVisible}
        />
        <PreparingScreen micGranted={mic.state === "granted"} />
      </div>
    );
  }

  const voiceNotice = voice.error && !voice.isRecording ? voice.error : null;
  const recordingDisabled = thinking || !voice.supported || !activeTurn;

  return (
    <div className="app-shell">
      <InterviewHeader
        jobTitle={jobTitle}
        analyticsVisible={analyticsVisible}
        onAnalyticsChange={setAnalyticsVisible}
      />
      <main className="grid h-[calc(100dvh-var(--interview-header-height))] min-h-[620px] overflow-hidden min-[1180px]:grid-cols-[minmax(0,1fr)_var(--interview-sidebar-width)]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <InterviewChat
            turns={turns}
            interviewerName={interviewerName}
            jobTitle={jobTitle}
            jobDescription={jobDescription}
            analyticsVisible={analyticsVisible}
            thinking={thinking}
            audioByTurn={audioByTurn}
          />

          {(!voice.supported || captureNotice || voiceNotice) && (
            <div className="space-y-3 border-t border-[var(--border-soft)] bg-white px-5 py-3 min-[900px]:px-8">
              {!voice.supported && (
                <Notice tone="warning">
                  Voice capture needs a Chromium-based browser such as Chrome
                  or Edge.
                </Notice>
              )}
              {captureNotice && <Notice tone="warning">{captureNotice}</Notice>}
              {voiceNotice && <Notice tone="danger">{voiceNotice}</Notice>}
            </div>
          )}

          <RecordButton
            isRecording={voice.isRecording}
            volumeOk={voice.volumeOk}
            disabled={recordingDisabled}
            level={voice.level}
            secondsLeft={secondsLeft}
            timeLimit={TIME_LIMIT}
            transcript={voice.transcript}
            interim={voice.interim}
            onStart={startRecording}
            onStop={stopAndSubmit}
          />
        </section>

        <div className="hidden min-[1180px]:block">
          <InterviewSidebar
            analyticsVisible={analyticsVisible}
            panel={panel}
            jobDescription={jobDescription}
          />
        </div>
      </main>
    </div>
  );
}
