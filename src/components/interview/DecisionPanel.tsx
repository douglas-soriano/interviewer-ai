import type {
  DecisionPanel as Panel,
  Dimension,
  SkillCoverage,
  SkillTier,
} from "@/domain/interview";
import { INTERVIEW_POLICY } from "@/domain/interviewPolicy";

const DIMENSION_LABELS: Record<Dimension, string> = {
  technical: "Technical",
  ownership: "Ownership",
  culture: "Culture fit",
};

const TIER_LABELS: Record<SkillTier, string> = {
  essential: "Essential",
  good_to_have: "Good to have",
  bonus: "Bonus",
};

const STATUS_STYLES: Record<SkillCoverage["status"], string> = {
  demonstrated: "border-[#c8f0dc] bg-[var(--success-soft)] text-[#0f8a55]",
  partial: "border-[#ffe0bd] bg-[var(--warning-soft)] text-[#b95d00]",
  gap: "border-[#ffd0cf] bg-[var(--danger-soft)] text-[#b3312e]",
};

function SkillChip({ skill }: { skill: SkillCoverage }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[skill.status]}`}
    >
      {skill.label}
      <span className="rounded-[4px] bg-white/60 px-1 text-[9px] font-semibold uppercase tracking-wide opacity-80">
        {TIER_LABELS[skill.tier]}
      </span>
    </span>
  );
}

export function DecisionPanel({ panel }: { panel: Panel }) {
  const covered = panel.skills.filter((skill) => skill.status !== "gap");
  const gaps = panel.skills.filter((skill) => skill.status === "gap");

  return (
    <section
      aria-live="polite"
      aria-label="Interviewer decision panel"
      className="flex flex-col gap-5 rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold leading-5 text-[var(--text-primary)]">
            Interview progress
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Live coverage of the interview signals collected so far.
          </p>
        </div>
        <span className="shrink-0 rounded-[7px] bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
          {panel.questionsAsked}/{INTERVIEW_POLICY.MAX_QUESTIONS}
        </span>
      </div>

      <div className="grid gap-3">
        {panel.dimensions.map((dimension) => (
          <div
            key={dimension.dimension}
            className="rounded-[10px] border border-[#e5e7f1] bg-[#fbfbff] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--text-secondary)]">
                {DIMENSION_LABELS[dimension.dimension]}
              </span>
              <span className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
                {dimension.score}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {dimension.positives} positive signals, {dimension.redFlags} red flags
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Skills covered
        </h3>
        <div className="flex flex-wrap gap-2">
          {covered.map((skill) => (
            <SkillChip key={skill.skillId} skill={skill} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Remaining gaps
        </h3>
        <div className="flex flex-wrap gap-2">
          {gaps.map((skill) => (
            <SkillChip key={skill.skillId} skill={skill} />
          ))}
        </div>
      </div>

      <p className="rounded-[9px] border border-[#dfe1ff] bg-[#f8f7ff] px-3 py-2 text-xs leading-5 text-[#4b507d]">
        {panel.reasoning}
      </p>
    </section>
  );
}
