import type { Session } from "@/domain/session";
import type { CreateSessionInput } from "@/dtos/createSession.dto";
import { getLlmProvider } from "@/providers/llm/getLlmProvider";
import type { LlmProvider } from "@/providers/llm/llmProvider";
import { sessionRepository } from "@/repositories/sessionRepository";
import { loadJobById } from "@/services/job/loadJobById";
import { endSession } from "./endSession";

async function endOrphanSessions(): Promise<void> {
  const sessions = await sessionRepository.findBy({ status: "in_progress" });

  for (const session of sessions) {
    try {
      await endSession(session.id);
    } catch (error) {
      console.warn("[createSession] failed to end open session", {
        sessionId: session.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export async function createSession(
  input: CreateSessionInput,
  llm: LlmProvider = getLlmProvider(),
): Promise<Session> {
  const job = await loadJobById(input.jobId);
  await endOrphanSessions();

  const question = await llm.openingQuestion({ job });
  const session = await sessionRepository.create({ jobId: job.id });

  await sessionRepository.addTurn({
    sessionId: session.id,
    index: 0,
    questionText: question,
    questionType: "opening",
  });

  const hydrated = await sessionRepository.find(session.id, {
    relations: ["turns", "job"],
  });

  console.info(`[createSession] session created`, { sessionId: session.id });
  return hydrated!;
}
