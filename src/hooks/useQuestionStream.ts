"use client";

import { useCallback } from "react";
import type {
  Decision,
  DecisionPanel,
  FinalEvaluation,
  QuestionType,
} from "@/domain/interview";
import { getUiErrorMessage } from "@/lib/uiError";

export interface StreamDonePayload {
  completed: boolean;
  decision: Decision;
  panel: DecisionPanel;
  nextTurn: {
    index: number;
    questionText: string;
    questionType: QuestionType;
    createdAt: string;
  } | null;
  finalEvaluation: FinalEvaluation | null;
}

export interface StreamHandlers {
  onToken: (value: string) => void;
  onDone: (payload: StreamDonePayload) => void;
  onError: (message: string) => void;
}

export function useQuestionStream() {
  const streamAnswer = useCallback(
    async (
      sessionId: string,
      body: { turnIndex: number; transcript: string },
      handlers: StreamHandlers,
    ) => {
      let response: Response;

      try {
        response = await fetch(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        handlers.onError("Network error while submitting the answer.");
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("text/event-stream")) {
        const failure = await response
          .json()
          .then(
            (json) =>
              json as { message?: string; code?: string } | undefined,
          )
          .catch(() => undefined);
        handlers.onError(
          failure
            ? getUiErrorMessage(failure, "submit")
            : "The interviewer could not process that answer.",
        );
        return;
      }

      if (!response.body) {
        handlers.onError(
          "The next question stream ended before the interviewer replied. Retry this answer.",
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawDone = false;

      const handleEvent = (raw: string) => {
        const line = raw
          .split("\n")
          .find((candidate) => candidate.startsWith("data:"));
        if (!line) {
          return;
        }

        try {
          const event = JSON.parse(line.slice(5).trim()) as
            | { type: "token"; value: string }
            | { type: "done"; payload: StreamDonePayload }
            | { type: "error"; message: string };

          if (event.type === "token") {
            handlers.onToken(event.value);
          } else if (event.type === "done") {
            sawDone = true;
            handlers.onDone(event.payload);
          } else if (event.type === "error") {
            sawDone = true;
            handlers.onError(event.message);
          }
        } catch {
          // Ignore malformed frames and wait for the next one.
        }
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          let separatorIndex = buffer.indexOf("\n\n");
          while (separatorIndex !== -1) {
            handleEvent(buffer.slice(0, separatorIndex));
            buffer = buffer.slice(separatorIndex + 2);
            separatorIndex = buffer.indexOf("\n\n");
          }
        }

        if (buffer.trim()) {
          handleEvent(buffer);
        }
      } catch {
        handlers.onError(
          "The next question stream was interrupted. Retry this answer to continue.",
        );
        return;
      }

      if (!sawDone) {
        handlers.onError(
          "The interviewer response was incomplete. Retry this answer to continue.",
        );
      }
    },
    [],
  );

  return { streamAnswer };
}
