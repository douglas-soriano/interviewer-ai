import type { Decision, DimensionScore, QuestionType } from "@/domain/interview";
import { INTERVIEW_POLICY } from "@/domain/interviewPolicy";
import type { Job, Turn } from "@/domain/session";
import { getLlmProvider } from "@/providers/llm/getLlmProvider";
import type {
  CriterionCoverage,
  LlmProvider,
} from "@/providers/llm/llmProvider";
import { scoreSignals } from "@/services/evaluation/scoreSignals";
import { isNonAnswer } from "./detectNonAnswer";

export interface GenerateNextQuestionInput {
  job: Job;
  history: Turn[];
  currentQuestion: string;
  currentQuestionType: QuestionType;
  currentAnswer: string;
  turnIndex: number;
  manipulationSuspected: boolean;
}

function computeCoverage(
  job: Job,
  history: Turn[],
): { coverage: CriterionCoverage[]; dimensions: DimensionScore[] } {
  const decisions = history
    .map((turn) => turn.decision)
    .filter((decision): decision is NonNullable<Turn["decision"]> => decision !== null);
  const scores = scoreSignals(job.rubric, decisions);
  const tierBySkillId = new Map(job.skills.map((skill) => [skill.id, skill.tier]));

  return {
    coverage: scores.criteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      dimension: criterion.dimension,
      type: criterion.type,
      tier: tierBySkillId.get(criterion.id),
      strength: criterion.strength,
    })),
    dimensions: scores.dimensions,
  };
}

export async function generateNextQuestion(
  input: GenerateNextQuestionInput,
  llm: LlmProvider = getLlmProvider(),
): Promise<Decision> {
  const { coverage, dimensions } = computeCoverage(input.job, input.history);
  const followUpsAsked =
    input.history.filter((turn) => turn.questionType === "follow_up").length +
    (input.currentQuestionType === "follow_up" ? 1 : 0);

  const decision = await llm.decide({
    job: input.job,
    history: input.history,
    currentQuestion: input.currentQuestion,
    currentAnswer: input.currentAnswer,
    turnIndex: input.turnIndex,
    minQuestions: INTERVIEW_POLICY.MIN_QUESTIONS,
    minFollowUps: INTERVIEW_POLICY.MIN_FOLLOWUPS,
    maxQuestions: INTERVIEW_POLICY.MAX_QUESTIONS,
    maxFollowUps: INTERVIEW_POLICY.MAX_FOLLOWUPS,
    followUpsAsked,
    coverage,
    dimensions,
    manipulationSuspected: input.manipulationSuspected,
  });

  const nonAnswer = isNonAnswer(input.currentAnswer);
  const evasive =
    decision.guardrail?.type === "evasive" ||
    decision.guardrail?.type === "off_topic";

  if (nonAnswer || evasive) {
    decision.signals = decision.signals.filter(
      (signal) => signal.polarity === "red_flag",
    );
  }

  const questionsAsked = input.turnIndex + 1;

  if (questionsAsked >= INTERVIEW_POLICY.MAX_QUESTIONS) {
    decision.shouldEnd = true;
    decision.questionType = "closing";
  } else if (
    questionsAsked < INTERVIEW_POLICY.MIN_QUESTIONS ||
    followUpsAsked < INTERVIEW_POLICY.MIN_FOLLOWUPS
  ) {
    decision.shouldEnd = false;

    if (decision.questionType === "closing") {
      decision.questionType =
        followUpsAsked < INTERVIEW_POLICY.MIN_FOLLOWUPS
          ? "follow_up"
          : "topic_shift";
    }
  }

  if (
    decision.questionType === "follow_up" &&
    followUpsAsked >= INTERVIEW_POLICY.MAX_FOLLOWUPS
  ) {
    decision.questionType = "topic_shift";
  }

  console.info(`[generateNextQuestion] decided`, {
    questionsAsked,
    followUpsAsked,
    questionType: decision.questionType,
    shouldEnd: decision.shouldEnd,
    nonAnswer,
    guardrail: decision.guardrail?.type ?? null,
  });

  return decision;
}
