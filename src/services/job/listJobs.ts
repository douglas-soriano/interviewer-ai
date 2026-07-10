import type { PublicJob } from "@/domain/session";
import { jobRepository } from "@/repositories/jobRepository";

export async function listJobs(): Promise<PublicJob[]> {
  const jobs = await jobRepository.findBy({});

  return jobs.map((job) => ({
    id: job.id,
    slug: job.slug,
    title: job.title,
    description: job.description,
    essentialSkills: job.skills
      .filter((skill) => skill.tier === "essential")
      .map((skill) => skill.label),
  }));
}
