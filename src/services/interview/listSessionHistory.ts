import type { InterviewHistoryItem } from "@/domain/session";
import { sessionRepository } from "@/repositories/sessionRepository";

const DEFAULT_HISTORY_LIMIT = 12;

export async function listSessionHistory(
  limit = DEFAULT_HISTORY_LIMIT,
): Promise<InterviewHistoryItem[]> {
  const sessions = await sessionRepository.findBy(
    {},
    { relations: ["job", "turns"], order: "newest", limit },
  );

  return sessions.map((session) => ({
    id: session.id,
    jobTitle: session.job?.title ?? "Unknown role",
    status: session.status,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    questionsAsked: session.turns.length,
    answeredQuestions: session.turns.filter(
      (turn) => turn.answerTranscript !== null,
    ).length,
    overallScore: session.finalEvaluation?.overallScore ?? null,
  }));
}
