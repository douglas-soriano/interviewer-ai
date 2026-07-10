import type { Dimension, FinalEvaluation as Evaluation } from "@/domain/interview";

const DIMENSION_LABELS: Record<Dimension, string> = {
  technical: "Technical",
  ownership: "Ownership",
  culture: "Culture fit",
};

function scoreTone(score: number): string {
  if (score >= 66) return "text-[#13935d]";
  if (score >= 40) return "text-[#b95d00]";
  return "text-[#b63835]";
}

function BulletList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "warning";
}) {
  const dotClass = tone === "positive" ? "bg-[#11b96c]" : "bg-[#ff9b2f]";

  return (
    <section className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden />
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function FinalEvaluation({ evaluation }: { evaluation: Evaluation }) {
  return (
    <section className="space-y-5">
      <div className="rounded-[14px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.3px] text-[var(--text-primary)]">
              Final evaluation
            </h2>
            <p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--text-secondary)]">
              Static result summary from the placeholder interview signals.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className={`text-5xl font-bold tabular-nums ${scoreTone(evaluation.overallScore)}`}>
              {evaluation.overallScore}
            </p>
            <p className="text-xs font-medium text-[var(--text-muted)]">out of 100</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 min-[760px]:grid-cols-3">
          {evaluation.dimensions.map((dimension) => (
            <div
              key={dimension.dimension}
              className="rounded-[12px] border border-[#e5e7f1] bg-[#fbfbff] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {DIMENSION_LABELS[dimension.dimension]}
                </p>
                <p className={`text-lg font-bold tabular-nums ${scoreTone(dimension.score)}`}>
                  {dimension.score}
                </p>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {dimension.positives} positive signals, {dimension.redFlags} red flags
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 min-[900px]:grid-cols-2">
        <BulletList title="Strengths" items={evaluation.strengths} tone="positive" />
        <BulletList title="Concerns" items={evaluation.concerns} tone="warning" />
      </div>
    </section>
  );
}
