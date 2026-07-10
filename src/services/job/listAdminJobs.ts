import type { Job } from "@/domain/session";
import { jobRepository } from "@/repositories/jobRepository";

export async function listAdminJobs(): Promise<Job[]> {
  return jobRepository.findBy({});
}
