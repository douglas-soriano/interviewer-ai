import "dotenv/config";
import postgres from "postgres";
import { getDatabaseUrl } from "./databaseUrl";

const sql = postgres(getDatabaseUrl(), { prepare: false });

async function pushSchema() {
  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('in_progress', 'completed');
      END IF;
    END
    $$;
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS jobs (
      id text PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      description text NOT NULL,
      persona jsonb NOT NULL,
      skills jsonb NOT NULL DEFAULT '[]'::jsonb,
      questions jsonb NOT NULL DEFAULT '[]'::jsonb,
      rubric jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      job_id text NOT NULL REFERENCES jobs(id),
      status session_status NOT NULL DEFAULT 'in_progress',
      final_evaluation jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      completed_at timestamptz
    );
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS turns (
      id text PRIMARY KEY,
      session_id text NOT NULL REFERENCES sessions(id),
      index integer NOT NULL,
      question_text text NOT NULL,
      question_type text NOT NULL,
      answer_transcript text,
      decision jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  console.log("[db:push] schema is ready");
}

pushSchema()
  .catch((error: unknown) => {
    console.error("[db:push] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
