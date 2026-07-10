export type Dimension = "technical" | "ownership" | "culture";

export type CriterionType = "positive" | "red_flag";

export type SkillTier = "essential" | "good_to_have" | "bonus";

export interface JobSkill {
  id: string;
  label: string;
  tier: SkillTier;
  dimension: Dimension;
}

export type QuestionCategory =
  | "technical"
  | "ownership"
  | "red_flag"
  | "culture";

export interface BankQuestion {
  id: string;
  category: QuestionCategory;
  text: string;
}

export type SkillCoverageStatus = "demonstrated" | "partial" | "gap";

export interface SkillCoverage {
  skillId: string;
  label: string;
  tier: SkillTier;
  dimension: Dimension;
  status: SkillCoverageStatus;
  strength: number;
}

export interface Criterion {
  id: string;
  dimension: Dimension;
  label: string;
  type: CriterionType;
  weight: number;
}

export interface Rubric {
  criteria: Criterion[];
}

export interface Persona {
  name: string;
  tone: string;
  focus: string;
}

export type QuestionType =
  | "opening"
  | "follow_up"
  | "topic_shift"
  | "redirect"
  | "closing";

export type GuardrailType = "manipulation" | "off_topic" | "evasive";

export interface GuardrailFlag {
  type: GuardrailType;
  note: string;
}

export interface Signal {
  criterionId: string;
  dimension: Dimension;
  polarity: CriterionType;
  strength: number;
  evidence: string;
}

export interface Decision {
  nextQuestion: string;
  questionType: QuestionType;
  questionSource: "bank" | "generated";
  signals: Signal[];
  reasoning: string;
  guardrail: GuardrailFlag | null;
  shouldEnd: boolean;
}

export interface DimensionScore {
  dimension: Dimension;
  score: number;
  positives: number;
  redFlags: number;
}

export interface DecisionPanel {
  dimensions: DimensionScore[];
  skills: SkillCoverage[];
  reasoning: string;
  lastGuardrail: GuardrailFlag | null;
  questionsAsked: number;
  followUps: number;
}

export interface FinalEvaluation {
  overallScore: number;
  dimensions: DimensionScore[];
  strengths: string[];
  concerns: string[];
  coveredTopics: string[];
  remainingGaps: string[];
}
