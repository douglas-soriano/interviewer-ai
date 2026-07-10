import type {
  Decision,
  Dimension,
  DimensionScore,
  SkillTier,
} from "@/domain/interview";
import type { Job, Turn } from "@/domain/session";

export interface CriterionCoverage {
  id: string;
  label: string;
  dimension: Dimension;
  type: "positive" | "red_flag";
  tier?: SkillTier;
  strength: number;
}

export interface DecideInput {
  job: Job;
  history: Turn[];
  currentQuestion: string;
  currentAnswer: string;
  turnIndex: number;
  minQuestions: number;
  minFollowUps: number;
  maxQuestions: number;
  maxFollowUps: number;
  followUpsAsked: number;
  coverage: CriterionCoverage[];
  dimensions: DimensionScore[];
  manipulationSuspected: boolean;
}

export interface LlmProvider {
  openingQuestion(input: { job: Job }): Promise<string>;
  decide(input: DecideInput): Promise<Decision>;
}
