import Image from "next/image";
import { Sparkle, Target } from "@phosphor-icons/react";
import type { Decision, Signal } from "@/domain/interview";
import type { ClientTurn } from "@/lib/serializers";

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
        {signals.map((signal, index) => (
          <li
            key={`${signal.criterionId}-${index}`}
            className="rounded-[8px] border border-[#e4e6f2] bg-white px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]"
          >
            <span className="font-semibold text-[#138b58]">Matched</span>
            <span className="text-[var(--text-faint)]">: </span>
            <span>{signal.criterionId}</span>
            <p className="mt-1 text-[var(--text-muted)]">{signal.evidence}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssistantBubble({
  interviewerName,
  questionNumber,
  turn,
  rationale,
  analyticsVisible,
}: {
  interviewerName: string;
  questionNumber: number;
  turn: ClientTurn;
  rationale: string | null;
  analyticsVisible: boolean;
}) {
  return (
    <article className="flex items-start gap-3">
      <AiAvatar />
      <div className="max-w-[760px] space-y-2">
        {analyticsVisible && rationale && (
          <div className="rounded-[12px] border border-[#dfe1ff] bg-[#f8f7ff] px-4 py-3 text-sm text-[#363b75]">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5c5feb]">
              <Target size={14} aria-hidden />
              Why this question
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
  analyticsVisible,
  decision,
}: {
  answer: string;
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
        <p className="whitespace-pre-wrap text-[15px] leading-7">{answer}</p>
        {analyticsVisible && decision && <SignalList signals={decision.signals} />}
      </div>
      <CandidateAvatar />
    </article>
  );
}

function ThinkingBubble() {
  return (
    <article className="flex items-start gap-3" aria-live="polite">
      <AiAvatar />
      <div className="max-w-[760px] rounded-[18px] rounded-tl-[5px] border border-[#dedffa] bg-white px-[18px] py-[14px] text-[var(--text-primary)] shadow-[0_5px_18px_rgb(28_32_86/0.045)]">
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <span>Drafting the next prompt</span>
          <span className="flex gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8c8ff5] [animation-delay:-160ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8c8ff5] [animation-delay:-80ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8c8ff5]" />
          </span>
        </div>
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
}: {
  turns: ClientTurn[];
  interviewerName: string;
  jobTitle: string;
  jobDescription: string;
  analyticsVisible: boolean;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#fdfdff]">
      <header className="border-b border-[var(--border-soft)] bg-white px-5 py-4 min-[900px]:px-8">
        <p className="text-sm font-bold text-[var(--text-primary)]">{jobTitle}</p>
        <p className="mt-1 line-clamp-2 max-w-[760px] text-sm leading-6 text-[var(--text-secondary)]">
          {jobDescription}
        </p>
      </header>

      <div
        className="soft-scrollbar flex-1 space-y-6 overflow-y-auto px-5 py-6 min-[900px]:px-8"
        role="log"
        aria-live="polite"
        aria-label="Interview conversation"
      >
        {turns.map((turn) => {
          const previousTurn = turns.find((item) => item.index === turn.index - 1);
          const rationale = previousTurn?.decision?.reasoning ?? null;

          return (
            <div key={turn.index} className="space-y-4">
              <AssistantBubble
                interviewerName={interviewerName}
                questionNumber={turn.index + 1}
                turn={turn}
                rationale={rationale}
                analyticsVisible={analyticsVisible}
              />
              {turn.answerTranscript && (
                <CandidateBubble
                  answer={turn.answerTranscript}
                  analyticsVisible={analyticsVisible}
                  decision={turn.decision}
                />
              )}
            </div>
          );
        })}
        <ThinkingBubble />
      </div>
    </section>
  );
}
