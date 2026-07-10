import type { Session } from "@/domain/session";
import { NotFoundError } from "@/lib/errors";
import { sessionRepository } from "@/repositories/sessionRepository";

export async function loadSession(id: string): Promise<Session> {
  const session = await sessionRepository.find(id, {
    relations: ["turns", "job"],
  });

  if (!session) {
    throw new NotFoundError(`Session ${id} not found`);
  }

  return session;
}
