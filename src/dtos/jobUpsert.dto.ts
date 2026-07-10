import { z } from "zod";

export const JobSkillSchema = z.object({
  id: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1, "Skill label is required").max(160),
  tier: z.enum(["essential", "good_to_have", "bonus"]),
  dimension: z.enum(["technical", "ownership", "culture"]),
});

export const BankQuestionSchema = z.object({
  id: z.string().trim().min(1).optional(),
  category: z.enum(["technical", "ownership", "red_flag", "culture"]),
  text: z.string().trim().min(1, "Question text is required").max(500),
});

export const RedFlagCriterionSchema = z.object({
  id: z.string().trim().min(1),
  dimension: z.enum(["technical", "ownership", "culture"]),
  label: z.string().trim().min(1).max(200),
  type: z.literal("red_flag"),
  weight: z.number().max(-1),
});

export const JobUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL safe")
    .optional(),
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(1000),
  persona: z.object({
    name: z.string().trim().min(1).max(60),
    tone: z.string().trim().min(1).max(300),
    focus: z.string().trim().min(1).max(300),
  }),
  skills: z.array(JobSkillSchema).min(1, "Register at least one skill").max(24),
  questions: z.array(BankQuestionSchema).max(100).default([]),
  redFlags: z.array(RedFlagCriterionSchema).max(12).default([]),
});

export type JobUpsertInput = z.infer<typeof JobUpsertSchema>;
