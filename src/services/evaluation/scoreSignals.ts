import type {
  Decision,
  Dimension,
  DimensionScore,
  Rubric,
} from "@/domain/interview";
import { Score } from "@/valueObjects/score";

const DIMENSIONS: Dimension[] = ["technical", "ownership", "culture"];

export const HIT_THRESHOLD = 0.34;

export interface ScoredCriterion {
  id: string;
  label: string;
  dimension: Dimension;
  type: "positive" | "red_flag";
  weight: number;
  strength: number;
  contribution: number;
}

export interface AggregateScores {
  overall: number;
  dimensions: DimensionScore[];
  criteria: ScoredCriterion[];
}

export function scoreSignals(
  rubric: Rubric,
  decisions: Decision[],
): AggregateScores {
  const strengthByCriterion = new Map<string, number>();

  for (const decision of decisions) {
    for (const signal of decision.signals) {
      const current = strengthByCriterion.get(signal.criterionId) ?? 0;
      if (signal.strength > current) {
        strengthByCriterion.set(signal.criterionId, signal.strength);
      }
    }
  }

  const criteria: ScoredCriterion[] = rubric.criteria.map((criterion) => {
    const strength = strengthByCriterion.get(criterion.id) ?? 0;

    return {
      id: criterion.id,
      label: criterion.label,
      dimension: criterion.dimension,
      type: criterion.type,
      weight: criterion.weight,
      strength,
      contribution: strength * criterion.weight,
    };
  });

  const dimensions: DimensionScore[] = DIMENSIONS.map((dimension) => {
    const matches = criteria.filter((criterion) => criterion.dimension === dimension);
    const maxPositive = matches
      .filter((criterion) => criterion.type === "positive")
      .reduce((sum, criterion) => sum + criterion.weight, 0);
    const raw = matches.reduce((sum, criterion) => sum + criterion.contribution, 0);

    return {
      dimension,
      score:
        maxPositive > 0
          ? Score.clamp((raw / maxPositive) * 100).toNumber()
          : 0,
      positives: matches.filter(
        (criterion) =>
          criterion.type === "positive" && criterion.strength >= HIT_THRESHOLD,
      ).length,
      redFlags: matches.filter(
        (criterion) =>
          criterion.type === "red_flag" && criterion.strength >= HIT_THRESHOLD,
      ).length,
    };
  });

  const maxPositiveAll = criteria
    .filter((criterion) => criterion.type === "positive")
    .reduce((sum, criterion) => sum + criterion.weight, 0);
  const rawAll = criteria.reduce(
    (sum, criterion) => sum + criterion.contribution,
    0,
  );

  return {
    overall:
      maxPositiveAll > 0
        ? Score.clamp((rawAll / maxPositiveAll) * 100).toNumber()
        : 0,
    dimensions,
    criteria,
  };
}
