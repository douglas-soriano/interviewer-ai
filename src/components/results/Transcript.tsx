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
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function Transcript({ turns }: { turns: ClientTurn[] }) {
  return (
    <section className="rounded-[14px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-bold tracking-[-0.3px] text-[var(--text-primary)]">
        Transcript
      </h2>
      <ol className="mt-5 flex flex-col gap-5">
        {turns.map((turn) => (
          <li
            key={turn.index}
            className="rounded-[12px] border border-[#e5e7f1] bg-[#fbfbff] p-5"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">
                Question {turn.index + 1}
              </span>
              <span className="rounded-[6px] bg-[var(--primary-soft)] px-2 py-1 font-medium text-[var(--primary)]">
                {QUESTION_TYPE_LABELS[turn.questionType]}
              </span>
              <span>{formatTime(turn.createdAt)}</span>
            </div>
            <p className="text-[15px] font-medium leading-7 text-[var(--text-primary)]">
              {turn.questionText}
            </p>
            <div className="mt-4 rounded-[10px] border border-[#e2e4f2] bg-white px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Candidate answer
              </p>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {turn.answerTranscript ?? "No answer recorded in this placeholder turn."}
              </p>
            </div>
            {turn.decision?.reasoning && (
              <div className="mt-3 rounded-[10px] border border-[#dfe1ff] bg-[#f8f7ff] px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#5c5feb]">
                  Interviewer rationale
                </p>
                <p className="text-sm leading-6 text-[#4b507d]">
                  {turn.decision.reasoning}
                </p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
