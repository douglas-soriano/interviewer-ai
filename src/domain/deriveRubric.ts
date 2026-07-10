import type { Criterion, JobSkill, Rubric, SkillTier } from "./interview";

export const TIER_WEIGHTS: Record<SkillTier, number> = {
  essential: 20,
  good_to_have: 12,
  bonus: 6,
};

export const DEFAULT_RED_FLAGS: Criterion[] = [
  {
    id: "rf-buzzword-bluff",
    dimension: "technical",
    label: "Uses tool names without explaining the underlying trade-offs",
    type: "red_flag",
    weight: -20,
  },
  {
    id: "rf-no-ownership",
    dimension: "ownership",
    label: "Deflects responsibility for outcomes or decisions",
    type: "red_flag",
    weight: -15,
  },
  {
    id: "rf-evasive",
    dimension: "culture",
    label: "Avoids direct answers to specific questions",
    type: "red_flag",
    weight: -10,
  },
];

export function deriveRubric(
  skills: JobSkill[],
  redFlags: Criterion[] = DEFAULT_RED_FLAGS,
): Rubric {
  return {
    criteria: [
      ...skills.map((skill) => ({
        id: skill.id,
        dimension: skill.dimension,
        label: skill.label,
        type: "positive" as const,
        weight: TIER_WEIGHTS[skill.tier],
      })),
      ...redFlags,
    ],
  };
}
