import type {
  Decision,
  DecisionPanel,
  FinalEvaluation,
} from "@/domain/interview";
import type { Turn } from "@/domain/session";
import type { RecordAnswerInput } from "@/dtos/recordAnswer.dto";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { getLlmProvider } from "@/providers/llm/getLlmProvider";
import type { LlmProvider } from "@/providers/llm/llmProvider";
import { sessionRepository } from "@/repositories/sessionRepository";
import { buildSessionPanel } from "./buildSessionPanel";
import { detectManipulation } from "./detectManipulation";
import { generateNextQuestion } from "./generateNextQuestion";

export interface RecordAnswerResult {
  decision: Decision;
  panel: DecisionPanel;
  completed: boolean;
  nextTurn: Turn | null;
  finalEvaluation: FinalEvaluation | null;
}

export async function recordCandidateAnswer(
  sessionId: string,
  input: RecordAnswerInput,
  llm: LlmProvider = getLlmProvider(),
): Promise<RecordAnswerResult> {
  const session = await sessionRepository.find(sessionId, {
    relations: ["turns", "job"],
  });

  if (!session) {
    throw new NotFoundError(`Session ${sessionId} not found`);
  }

  if (!session.job) {
    throw new NotFoundError(`Job for session ${sessionId} is missing`);
  }

  const currentTurn = session.turns.find((turn) => turn.index === input.turnIndex);
  if (!currentTurn) {
    throw new NotFoundError(`Turn ${input.turnIndex} not found`);
  }

  if (currentTurn.decision !== null) {
    console.info(`[recordCandidateAnswer] replaying persisted turn`, {
      sessionId,
      turnIndex: input.turnIndex,
    });

    return {
      decision: currentTurn.decision,
      panel: buildSessionPanel(session.job, session.turns),
      completed: session.status === "completed",
      nextTurn:
        session.turns.find((turn) => turn.index === input.turnIndex + 1) ?? null,
      finalEvaluation: session.finalEvaluation,
    };
  }

  if (session.status === "completed") {
    throw new ConflictError("Interview is already completed");
  }

  const manipulation = detectManipulation(input.transcript);
  const decision = await generateNextQuestion(
    {
      job: session.job,
      history: session.turns.filter((turn) => turn.index < input.turnIndex),
      currentQuestion: currentTurn.questionText,
      currentQuestionType: currentTurn.questionType,
      currentAnswer: input.transcript,
      turnIndex: input.turnIndex,
      manipulationSuspected: manipulation.suspected,
    },
    llm,
  );

  if (manipulation.suspected && !decision.guardrail) {
    decision.guardrail = {
      type: "manipulation",
      note: manipulation.note ?? "Manipulation suspected.",
    };
  }

  await sessionRepository.updateTurn(currentTurn.id, {
    answerTranscript: input.transcript,
    decision,
  });

  currentTurn.answerTranscript = input.transcript;
  currentTurn.decision = decision;

  if (decision.shouldEnd) {
    await sessionRepository.update(sessionId, {
      status: "completed",
      completedAt: new Date(),
    });

    const completedSession = await sessionRepository.find(sessionId, {
      relations: ["turns", "job"],
    });
    const turns = completedSession?.turns ?? session.turns;

    return {
      decision,
      panel: buildSessionPanel(session.job, turns),
      completed: true,
      nextTurn: null,
      finalEvaluation: completedSession?.finalEvaluation ?? null,
    };
  }

  const nextTurn = await sessionRepository.addTurn({
    sessionId,
    index: input.turnIndex + 1,
    questionText: decision.nextQuestion,
    questionType: decision.questionType,
  });

  return {
    decision,
    panel: buildSessionPanel(session.job, [...session.turns, nextTurn]),
    completed: false,
    nextTurn,
    finalEvaluation: null,
  };
}
