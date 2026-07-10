import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  jobs,
  sessions,
  turns,
  type JobRow,
  type SessionRow,
  type TurnRow,
} from "@/db/schema";
import type {
  Decision,
  FinalEvaluation,
  QuestionType,
} from "@/domain/interview";
import type { Job, Session, Turn } from "@/domain/session";

type Relation = "turns" | "job";
type SessionOrder = "newest" | "oldest";

function jobToDomain(row: JobRow): Job {
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

function turnToDomain(row: TurnRow): Turn {
  return {
    id: row.id,
    sessionId: row.sessionId,
    index: row.index,
    questionText: row.questionText,
    questionType: row.questionType,
    answerTranscript: row.answerTranscript,
    decision: row.decision,
    createdAt: row.createdAt,
  };
}

async function hydrateSession(
  row: SessionRow,
  relations: Relation[] = [],
): Promise<Session> {
  const session: Session = {
    id: row.id,
    jobId: row.jobId,
    status: row.status,
    finalEvaluation: row.finalEvaluation,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    turns: [],
  };

  if (relations.includes("turns")) {
    const turnRows = await db
      .select()
      .from(turns)
      .where(eq(turns.sessionId, row.id))
      .orderBy(asc(turns.index));
    session.turns = turnRows.map(turnToDomain);
  }

  if (relations.includes("job")) {
    const jobRows = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, row.jobId))
      .limit(1);
    if (jobRows[0]) session.job = jobToDomain(jobRows[0]);
  }

  return session;
}

type SessionUpdate = Partial<{
  status: Session["status"];
  finalEvaluation: FinalEvaluation;
  completedAt: Date | null;
}>;

export const sessionRepository = {
  async find(
    id: string,
    opts?: { relations?: Relation[] },
  ): Promise<Session | null> {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    return rows[0] ? hydrateSession(rows[0], opts?.relations) : null;
  },

  async findBy(
    criteria: Partial<Pick<Session, "id" | "jobId" | "status">>,
    opts?: { relations?: Relation[]; order?: SessionOrder; limit?: number },
  ): Promise<Session[]> {
    const clauses: SQL[] = [];
    if (criteria.id) clauses.push(eq(sessions.id, criteria.id));
    if (criteria.jobId) clauses.push(eq(sessions.jobId, criteria.jobId));
    if (criteria.status) clauses.push(eq(sessions.status, criteria.status));

    let query = db.select().from(sessions).$dynamic();
    if (clauses.length) query = query.where(and(...clauses));

    query = query.orderBy(
      opts?.order === "oldest"
        ? asc(sessions.createdAt)
        : desc(sessions.createdAt),
    );

    if (opts?.limit !== undefined) {
      query = query.limit(opts.limit);
    }

    const rows = await query;
    return Promise.all(
      rows.map((row) => hydrateSession(row, opts?.relations ?? [])),
    );
  },

  async create(input: { jobId: string; id?: string }): Promise<Session> {
    const rows = await db
      .insert(sessions)
      .values({ id: input.id ?? randomUUID(), jobId: input.jobId })
      .returning();

    return hydrateSession(rows[0]);
  },

  async update(id: string, fields: SessionUpdate): Promise<Session | null> {
    const rows = await db
      .update(sessions)
      .set({
        ...(fields.status !== undefined ? { status: fields.status } : {}),
        ...(fields.finalEvaluation !== undefined
          ? { finalEvaluation: fields.finalEvaluation }
          : {}),
        ...(fields.completedAt !== undefined
          ? { completedAt: fields.completedAt }
          : {}),
      })
      .where(eq(sessions.id, id))
      .returning();

    return rows[0] ? hydrateSession(rows[0]) : null;
  },

  async addTurn(input: {
    sessionId: string;
    index: number;
    questionText: string;
    questionType: QuestionType;
    id?: string;
  }): Promise<Turn> {
    const rows = await db
      .insert(turns)
      .values({
        id: input.id ?? randomUUID(),
        sessionId: input.sessionId,
        index: input.index,
        questionText: input.questionText,
        questionType: input.questionType,
      })
      .returning();

    return turnToDomain(rows[0]);
  },

  async updateTurn(
    turnId: string,
    fields: Partial<{ answerTranscript: string; decision: Decision }>,
  ): Promise<Turn | null> {
    const rows = await db
      .update(turns)
      .set({
        ...(fields.answerTranscript !== undefined
          ? { answerTranscript: fields.answerTranscript }
          : {}),
        ...(fields.decision !== undefined ? { decision: fields.decision } : {}),
      })
      .where(eq(turns.id, turnId))
      .returning();

    return rows[0] ? turnToDomain(rows[0]) : null;
  },
};
