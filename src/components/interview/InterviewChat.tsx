"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { Sparkle, Target } from "@phosphor-icons/react";
import type { Decision, Signal } from "@/domain/interview";
import type { VoiceRecording } from "@/hooks/useVoiceCapture";
import type { ClientTurn } from "@/lib/serializers";
import { AudioMessage } from "./AudioMessage";

const QUESTION_TYPE_LABELS: Record<ClientTurn["questionType"], string> = {
  opening: "Opening",
  follow_up: "Follow-up",
  topic_shift: "New topic",
  redirect: "Redirect",
  closing: "Closing",
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function AiAvatar() {
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_18px_rgb(82_76_245/0.20)]">
      <Sparkle size={18} weight="bold" aria-hidden />
    </div>
  );
}

function CandidateAvatar() {
  return (
    <Image
      src="/candidate-avatar.jpg"
      alt="Candidate"
      width={36}
      height={36}
      className="h-9 w-9 shrink-0 rounded-full bg-[#eef0f3] object-cover shadow-[var(--shadow-avatar)]"
    />
  );
}

function SignalList({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 rounded-[12px] border border-[#e2e4f2] bg-white/90 p-4 text-left">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Signals
      </p>
      <ul className="space-y-2">
        {signals.map((signal, index) => {
          const isRedFlag = signal.polarity === "red_flag";

          return (
            <li
              key={`${signal.criterionId}-${index}`}
              className="rounded-[8px] border border-[#e4e6f2] bg-white px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]"
            >
              <span
                className={
                  isRedFlag
                    ? "font-semibold text-[#b63835]"
                    : "font-semibold text-[#138b58]"
                }
              >
                {isRedFlag ? "Red flag" : "Matched"}
              </span>
              <span className="text-[var(--text-faint)]">: </span>
              <span>{signal.criterionId}</span>
              {signal.evidence && (
                <p className="mt-1 text-[var(--text-muted)]">
                  {signal.evidence}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AssistantBubble({
  interviewerName,
  questionNumber,
  turn,
  rationale,
  fromBank,
  analyticsVisible,
}: {
  interviewerName: string;
  questionNumber: number;
  turn: ClientTurn;
  rationale: string | null;
  fromBank: boolean;
  analyticsVisible: boolean;
}) {
  return (
    <article className="flex items-start gap-3">
      <AiAvatar />
      <div className="max-w-[760px] space-y-2">
        {analyticsVisible && rationale && (
          <div className="rounded-[12px] border border-[#dfe1ff] bg-[#f8f7ff] px-4 py-3 text-sm text-[#363b75]">
            <p className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5c5feb]">
              <Target size={14} aria-hidden />
              Why this question
              {fromBank && (
                <span className="rounded-[5px] border border-[#d3d4fb] bg-white px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-wide text-[#5c5feb]">
                  From the question bank
                </span>
              )}
            </p>
            <p className="leading-6">{rationale}</p>
          </div>
        )}
        <div className="rounded-[18px] rounded-tl-[5px] border border-[#dedffa] bg-white px-[18px] py-[14px] shadow-[0_5px_18px_rgb(28_32_86/0.045)]">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">
              {interviewerName}
            </span>
            <span>Question {questionNumber}</span>
            <span>{QUESTION_TYPE_LABELS[turn.questionType]}</span>
            <span>{formatTime(turn.createdAt)}</span>
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-primary)]">
            {turn.questionText}
          </p>
        </div>
      </div>
    </article>
  );
}

function CandidateBubble({
  answer,
  audio,
  analyticsVisible,
  decision,
}: {
  answer: string;
  audio: VoiceRecording | null;
  analyticsVisible: boolean;
  decision: Decision | null;
}) {
  return (
    <article className="flex justify-end gap-3">
      <div className="relative w-full max-w-[760px] rounded-[18px] rounded-tr-[5px] border border-[#dfe0f2] bg-[image:var(--gradient-user-bubble)] px-[18px] py-[14px] text-[var(--text-primary)] shadow-[0_5px_18px_rgb(28_32_86/0.035)]">
        <span className="absolute right-[-5px] top-4 h-3 w-3 rotate-45 border-r border-t border-[#dfe0f2] bg-[#f4f4fd]" />
        <div className="mb-2 flex items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-primary)]">You</span>
          <span>Voice answer</span>
        </div>
        {audio ? (
          <AudioMessage
            url={audio.url}
            durationMs={audio.durationMs}
            transcript={answer}
          />
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-7">{answer}</p>
        )}
        {analyticsVisible && decision?.guardrail && (
          <div className="mt-4 rounded-[10px] border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-2 text-xs leading-5 text-[#a6302d]">
            <span className="font-semibold">Guardrail:</span>{" "}
            {decision.guardrail.note}
          </div>
        )}
        {analyticsVisible && decision && <SignalList signals={decision.signals} />}
      </div>
      <CandidateAvatar />
    </article>
  );
}

function ThinkingBubble({ text }: { text: string }) {
  const typing = text.length > 0;

  return (
    <article className="flex items-start gap-3" aria-live="polite">
      <AiAvatar />
      <div className="max-w-[760px] rounded-[18px] rounded-tl-[5px] border border-[#dedffa] bg-white px-[18px] py-[14px] text-[var(--text-primary)] shadow-[0_5px_18px_rgb(28_32_86/0.045)]">
        {typing ? (
          <p className="whitespace-pre-wrap text-[15px] leading-7">
            {text}
            <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-[var(--primary)] align-middle motion-reduce:animate-none" />
          </p>
        ) : (
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span>Preparing a follow-up question.</span>
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8c8ff5] motion-reduce:animate-none [animation-delay:-160ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8c8ff5] motion-reduce:animate-none [animation-delay:-80ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8c8ff5] motion-reduce:animate-none" />
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export function InterviewChat({
  turns,
  interviewerName,
  jobTitle,
  jobDescription,
  analyticsVisible,
  thinking = false,
  thinkingText = "",
  audioByTurn = {},
}: {
  turns: ClientTurn[];
  interviewerName: string;
  jobTitle: string;
  jobDescription: string;
  analyticsVisible: boolean;
  thinking?: boolean;
  thinkingText?: string;
  audioByTurn?: Record<number, VoiceRecording>;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const orderedTurns = useMemo(
    () => [...turns].sort((left, right) => left.index - right.index),
    [turns],
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [orderedTurns.length, thinkingText]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#fdfdff]">
      <header className="border-b border-[var(--border-soft)] bg-white px-5 py-4 min-[900px]:px-8">
        <p className="text-sm font-bold text-[var(--text-primary)]">{jobTitle}</p>
        {jobDescription && (
          <p className="mt-1 line-clamp-2 max-w-[760px] text-sm leading-6 text-[var(--text-secondary)]">
            {jobDescription}
          </p>
        )}
      </header>

      <div
        ref={listRef}
        className="soft-scrollbar flex-1 space-y-6 overflow-y-auto px-5 py-6 min-[900px]:px-8"
        role="log"
        aria-live="polite"
        aria-label="Interview conversation"
      >
        {orderedTurns.map((turn) => {
          const previousTurn = orderedTurns.find(
            (item) => item.index === turn.index - 1,
          );
          const rationale = previousTurn?.decision?.reasoning ?? null;
          const fromBank = previousTurn?.decision?.questionSource === "bank";

          return (
            <div key={turn.index} className="space-y-4">
              <AssistantBubble
                interviewerName={interviewerName}
                questionNumber={turn.index + 1}
                turn={turn}
                rationale={rationale}
                fromBank={fromBank}
                analyticsVisible={analyticsVisible}
              />
              {turn.answerTranscript && (
                <CandidateBubble
                  answer={turn.answerTranscript}
                  audio={audioByTurn[turn.index] ?? null}
                  analyticsVisible={analyticsVisible}
                  decision={turn.decision}
                />
              )}
            </div>
          );
        })}
        {thinking && <ThinkingBubble text={thinkingText} />}
      </div>
    </section>
  );
}
