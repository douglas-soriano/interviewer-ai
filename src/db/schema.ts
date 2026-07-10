import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  BankQuestion,
  Decision,
  FinalEvaluation,
  JobSkill,
  Persona,
  QuestionType,
  Rubric,
} from "@/domain/interview";

export const sessionStatus = pgEnum("session_status", [
  "in_progress",
  "completed",
]);

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  persona: jsonb("persona").$type<Persona>().notNull(),
  skills: jsonb("skills")
    .$type<JobSkill[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  questions: jsonb("questions")
    .$type<BankQuestion[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  rubric: jsonb("rubric").$type<Rubric>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  status: sessionStatus("status").notNull().default("in_progress"),
  finalEvaluation: jsonb("final_evaluation").$type<FinalEvaluation>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const turns = pgTable("turns", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  index: integer("index").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").$type<QuestionType>().notNull(),
  answerTranscript: text("answer_transcript"),
  decision: jsonb("decision").$type<Decision>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type JobRow = typeof jobs.$inferSelect;
export type NewJobRow = typeof jobs.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
export type TurnRow = typeof turns.$inferSelect;
export type NewTurnRow = typeof turns.$inferInsert;
