import type { JobSkill, SkillCoverage } from "@/domain/interview";
import type { ScoredCriterion } from "./scoreSignals";

export const DEMONSTRATED_THRESHOLD = 0.5;

const TIER_ORDER = {
  essential: 0,
  good_to_have: 1,
  bonus: 2,
} as const;

export function computeSkillCoverage(
  skills: JobSkill[],
  criteria: ScoredCriterion[],
): SkillCoverage[] {
  const strengthById = new Map(criteria.map((criterion) => [criterion.id, criterion.strength]));

  return skills
    .map((skill): SkillCoverage => {
      const strength = strengthById.get(skill.id) ?? 0;

      return {
        skillId: skill.id,
        label: skill.label,
        tier: skill.tier,
        dimension: skill.dimension,
        status:
          strength >= DEMONSTRATED_THRESHOLD
            ? "demonstrated"
            : strength > 0
              ? "partial"
              : "gap",
        strength,
      };
    })
    .sort((left, right) => TIER_ORDER[left.tier] - TIER_ORDER[right.tier]);
}
