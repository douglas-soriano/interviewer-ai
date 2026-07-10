import type {
  DecisionPanel as Panel,
  Dimension,
  SkillCoverage,
  SkillTier,
} from "@/domain/interview";
import { INTERVIEW_POLICY } from "@/domain/interviewPolicy";

const DIMENSION_LABELS: Record<Dimension, string> = {
  technical: "Technical",
  ownership: "Ownership / Red flags",
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

function Bar({ score }: { score: number }) {
  const color =
    score >= 66
      ? "accent-[#11b96c]"
      : score >= 40
        ? "accent-[#ff9b2f]"
        : "accent-[#ff4d4a]";

  return (
    <progress
      value={score}
      max={100}
      className={`h-2 w-full overflow-hidden rounded-full bg-[var(--meter-empty)] ${color}`}
      aria-label={`Score ${score} out of 100`}
    />
  );
}

function SkillChip({ skill }: { skill: SkillCoverage }) {
  const statusLabel =
    skill.status === "demonstrated"
      ? "demonstrated"
      : skill.status === "partial"
        ? "partial evidence"
        : "no evidence yet";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[skill.status]}`}
      title={`${TIER_LABELS[skill.tier]} - ${statusLabel}`}
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold leading-5 text-[var(--text-primary)]">
          Interview progress
        </h2>
        <span className="text-right text-xs leading-5 text-[var(--text-muted)]">
          {panel.questionsAsked}/{INTERVIEW_POLICY.MAX_QUESTIONS} questions
          <br />
          {panel.followUps}/{INTERVIEW_POLICY.MAX_FOLLOWUPS} follow-ups
        </span>
      </div>

      <div className="grid gap-4">
        {panel.dimensions.map((dimension) => (
          <div key={dimension.dimension}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--text-secondary)]">
                {DIMENSION_LABELS[dimension.dimension]}
              </span>
              <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                {dimension.score}
                {dimension.redFlags > 0 && (
                  <span className="ml-2 text-[#d83c39]">
                    Red flags {dimension.redFlags}
                  </span>
                )}
              </span>
            </div>
            <Bar score={dimension.score} />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {dimension.positives} positive signals, {dimension.redFlags} red flags
            </p>
          </div>
        ))}
      </div>

      {panel.lastGuardrail && (
        <div className="rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-3 text-sm text-[#a6302d]">
          <span className="font-semibold">
            Guardrail ({panel.lastGuardrail.type}):
          </span>{" "}
          {panel.lastGuardrail.note}
        </div>
      )}

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
