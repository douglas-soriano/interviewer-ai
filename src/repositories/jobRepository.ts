import { randomUUID } from "node:crypto";
import { and, eq, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { jobs, type JobRow, type NewJobRow } from "@/db/schema";
import type { Job, PublicJob } from "@/domain/session";

function toDomain(row: JobRow): Job {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    persona: row.persona,
    skills: row.skills,
    questions: row.questions,
    rubric: row.rubric,
    createdAt: row.createdAt,
  };
}

function toPublicJob(job: Job): PublicJob {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    description: job.description,
    essentialSkills: job.skills
      .filter((skill) => skill.tier === "essential")
      .map((skill) => skill.label),
  };
}

type JobCriteria = Partial<Pick<Job, "id" | "slug">>;
type CreateJobInput = Omit<NewJobRow, "id"> & { id?: string };

export const jobRepository = {
  async list(): Promise<Job[]> {
    const rows = await db.select().from(jobs).orderBy(jobs.createdAt);
    return rows.map(toDomain);
  },

  async listPublic(): Promise<PublicJob[]> {
    const allJobs = await this.list();
    return allJobs.map(toPublicJob);
  },

  async find(id: string): Promise<Job | null> {
    const rows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return rows[0] ? toDomain(rows[0]) : null;
  },

  async findBySlug(slug: string): Promise<Job | null> {
    const rows = await db
      .select()
      .from(jobs)
      .where(eq(jobs.slug, slug))
      .limit(1);
    return rows[0] ? toDomain(rows[0]) : null;
  },

  async findBy(criteria: JobCriteria): Promise<Job[]> {
    const clauses: SQL[] = [];
    if (criteria.id) clauses.push(eq(jobs.id, criteria.id));
    if (criteria.slug) clauses.push(eq(jobs.slug, criteria.slug));

    let query = db.select().from(jobs).$dynamic();
    if (clauses.length) query = query.where(and(...clauses));

    const rows = await query.orderBy(jobs.createdAt);

    return rows.map(toDomain);
  },

  async create(input: CreateJobInput): Promise<Job> {
    const rows = await db
      .insert(jobs)
      .values({ ...input, id: input.id ?? randomUUID() })
      .returning();
    return toDomain(rows[0]);
  },

  async update(
    id: string,
    patch: Partial<Omit<NewJobRow, "id" | "createdAt">>,
  ): Promise<Job | null> {
    const rows = await db
      .update(jobs)
      .set(patch)
      .where(eq(jobs.id, id))
      .returning();

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async delete(id: string): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  },
};
