import type { Session } from "@/domain/session";
import type { CreateSessionInput } from "@/dtos/createSession.dto";
import { getLlmProvider } from "@/providers/llm/getLlmProvider";
import type { LlmProvider } from "@/providers/llm/llmProvider";
import { sessionRepository } from "@/repositories/sessionRepository";
import { loadJobById } from "@/services/job/loadJobById";

export async function createSession(
  input: CreateSessionInput,
  llm: LlmProvider = getLlmProvider(),
): Promise<Session> {
  const job = await loadJobById(input.jobId);
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
