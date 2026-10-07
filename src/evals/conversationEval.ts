import { z } from "zod";

const RatingSchema = z.number().int().min(1).max(5);

export const ConversationTurnSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const HumanConversationEvaluationSchema = z.object({
  relevance: RatingSchema,
  followUpQuality: RatingSchema,
  evidenceGrounding: RatingSchema,
  coherence: RatingSchema,
  pass: z.boolean(),
  notes: z.string().optional(),
});

export const ConversationEvalCaseSchema = z.object({
  id: z.string().min(1),
  sourceSessionId: z.string().optional(),
  kind: z.enum(["calibration", "regression"]).default("regression"),
  role: z.string().min(1),
  conversation: z.array(ConversationTurnSchema).min(1),
  human: HumanConversationEvaluationSchema,
});

export const ConversationEvalSuiteSchema = z.array(ConversationEvalCaseSchema).min(1);

export const JudgeConversationEvaluationSchema = z.object({
  relevance: RatingSchema,
  followUpQuality: RatingSchema,
  evidenceGrounding: RatingSchema,
  coherence: RatingSchema,
  pass: z.boolean(),
  rationale: z.array(z.string()).min(1).max(6),
});

export type ConversationEvalCase = z.infer<typeof ConversationEvalCaseSchema>;
export type JudgeConversationEvaluation = z.infer<
  typeof JudgeConversationEvaluationSchema
>;

export interface EvalCaseResult {
  id: string;
  judge: JudgeConversationEvaluation;
  human: ConversationEvalCase["human"];
  latencyMs: number;
  passAgreement: boolean;
  meanAbsoluteRatingDelta: number;
}

export interface EvalSummary {
  cases: number;
  judgePassRate: number;
  humanPassRate: number;
  passAgreementRate: number;
  meanJudgeRating: number;
  meanAbsoluteRatingDelta: number;
  p50LatencyMs: number;
}

const DIMENSIONS = [
  "relevance",
  "followUpQuality",
  "evidenceGrounding",
  "coherence",
] as const;

export function summarizeEvalResults(results: EvalCaseResult[]): EvalSummary {
  const mean = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

  const judgeRatings = results.flatMap((result) =>
    DIMENSIONS.map((dimension) => result.judge[dimension]),
  );

  const latencies = results
    .map((result) => result.latencyMs)
    .sort((left, right) => left - right);
  const p50Index = Math.floor((latencies.length - 1) * 0.5);

  return {
    cases: results.length,
    judgePassRate: mean(results.map((result) => (result.judge.pass ? 1 : 0))),
    humanPassRate: mean(results.map((result) => (result.human.pass ? 1 : 0))),
    passAgreementRate: mean(
      results.map((result) => (result.passAgreement ? 1 : 0)),
    ),
    meanJudgeRating: mean(judgeRatings),
    meanAbsoluteRatingDelta: mean(
      results.map((result) => result.meanAbsoluteRatingDelta),
    ),
    p50LatencyMs: latencies[p50Index] ?? 0,
  };
}

export function compareToHuman(
  testCase: ConversationEvalCase,
  judge: JudgeConversationEvaluation,
  latencyMs: number,
): EvalCaseResult {
  const deltas = DIMENSIONS.map((dimension) =>
    Math.abs(judge[dimension] - testCase.human[dimension]),
  );

  return {
    id: testCase.id,
    judge,
    human: testCase.human,
    latencyMs,
    passAgreement: judge.pass === testCase.human.pass,
    meanAbsoluteRatingDelta:
      deltas.reduce((sum, value) => sum + value, 0) / deltas.length,
  };
}
