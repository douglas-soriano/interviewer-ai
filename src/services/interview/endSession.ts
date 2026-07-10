import type { Session } from "@/domain/session";
import { NotFoundError } from "@/lib/errors";
import { sessionRepository } from "@/repositories/sessionRepository";
import { aggregateFinalEvaluation } from "@/services/evaluation/aggregateFinalEvaluation";

export async function endSession(sessionId: string): Promise<Session> {
  const session = await sessionRepository.find(sessionId, {
    relations: ["turns", "job"],
  });

  if (!session) {
    throw new NotFoundError(`Session ${sessionId} not found`);
  }

  if (session.status === "completed") {
    return session;
  }

  if (!session.job) {
    throw new NotFoundError(`Job for session ${sessionId} is missing`);
  }

  const finalEvaluation = aggregateFinalEvaluation(session.job, session.turns);
  const completedAt = new Date();

  await sessionRepository.update(sessionId, {
    status: "completed",
    finalEvaluation,
    completedAt,
  });

  session.status = "completed";
  session.finalEvaluation = finalEvaluation;
  session.completedAt = completedAt;

  console.info("[endSession] interview ended", {
    sessionId,
    answeredTurns: session.turns.filter((turn) => turn.decision !== null).length,
    overallScore: finalEvaluation.overallScore,
  });

  return session;
}
