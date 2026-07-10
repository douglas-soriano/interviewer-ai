import { ConflictError, NotFoundError } from "@/lib/errors";
import { jobRepository } from "@/repositories/jobRepository";
import { sessionRepository } from "@/repositories/sessionRepository";

export async function deleteJob(id: string): Promise<void> {
  const job = await jobRepository.find(id);
  if (!job) throw new NotFoundError(`Job ${id} not found`);

  const sessions = await sessionRepository.findBy({ jobId: id }, { limit: 1 });
  if (sessions.length > 0) {
    throw new ConflictError(
      "This job already has recorded interviews. Deleting it would orphan their history.",
    );
  }

  await jobRepository.delete(id);
}
