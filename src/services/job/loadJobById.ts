import type { Job } from "@/domain/session";
import { NotFoundError } from "@/lib/errors";
import { jobRepository } from "@/repositories/jobRepository";

export async function loadJobById(id: string): Promise<Job> {
  const job = await jobRepository.find(id);
  if (!job) throw new NotFoundError(`Job ${id} not found`);
  return job;
}
