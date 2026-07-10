import { randomUUID } from "node:crypto";
import type { BankQuestion, Criterion, JobSkill } from "@/domain/interview";
import { DEFAULT_RED_FLAGS, deriveRubric } from "@/domain/deriveRubric";
import type { Job } from "@/domain/session";
import type { JobUpsertInput } from "@/dtos/jobUpsert.dto";
import { NotFoundError } from "@/lib/errors";
import { jobRepository } from "@/repositories/jobRepository";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function shortId(): string {
  return randomUUID().slice(0, 8);
}

function withIds(input: JobUpsertInput): {
  skills: JobSkill[];
  questions: BankQuestion[];
} {
  const skills = input.skills.map((skill) => ({
    id:
      skill.id ??
      `skill-${slugify(skill.label).slice(0, 40) || shortId()}-${shortId()}`,
    label: skill.label,
    tier: skill.tier,
    dimension: skill.dimension,
  }));

  const questions = input.questions.map((question) => ({
    id: question.id ?? `q-${shortId()}`,
    category: question.category,
    text: question.text,
  }));

  return { skills, questions };
}

async function uniqueSlug(baseValue: string, ignoreId?: string): Promise<string> {
  const base = slugify(baseValue) || "job";
  const jobs = await jobRepository.findBy({});
  const taken = new Set(
    jobs.filter((job) => job.id !== ignoreId).map((job) => job.slug),
  );

  if (!taken.has(base)) return base;
  return `${base}-${shortId()}`;
}

export async function createJob(input: JobUpsertInput): Promise<Job> {
  const { skills, questions } = withIds(input);
  const slug = await uniqueSlug(input.slug ?? input.title);

  return jobRepository.create({
    slug,
    title: input.title,
    description: input.description,
    persona: input.persona,
    skills,
    questions,
    rubric: deriveRubric(skills, DEFAULT_RED_FLAGS),
  });
}

export async function updateJob(id: string, input: JobUpsertInput): Promise<Job> {
  const existing = await jobRepository.find(id);
  if (!existing) throw new NotFoundError(`Job ${id} not found`);

  const { skills, questions } = withIds(input);
  const redFlags: Criterion[] = existing.rubric.criteria.filter(
    (criterion) => criterion.type === "red_flag",
  );

  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueSlug(input.slug, id)
      : existing.slug;

  const updated = await jobRepository.update(id, {
    slug,
    title: input.title,
    description: input.description,
    persona: input.persona,
    skills,
    questions,
    rubric: deriveRubric(skills, redFlags.length ? redFlags : DEFAULT_RED_FLAGS),
  });

  if (!updated) throw new NotFoundError(`Job ${id} not found`);
  return updated;
}
