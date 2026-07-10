import "dotenv/config";
import { randomUUID } from "node:crypto";
import { db } from "./client";
import { jobs, type NewJobRow } from "./schema";
import { deriveRubric } from "../domain/deriveRubric";
import type { BankQuestion, Criterion, JobSkill, Persona } from "../domain/interview";

interface SeedJob {
  slug: string;
  title: string;
  description: string;
  persona: Persona;
  skills: JobSkill[];
  questions: BankQuestion[];
  redFlags: Criterion[];
}

const seedJobs: SeedJob[] = [
  {
    slug: "backend-engineer",
    title: "Senior Backend Engineer",
    description:
      "Own backend services across APIs, data modeling, reliability, and production trade-offs.",
    persona: {
      name: "Dana",
      tone: "Direct, technically curious, and specific when answers stay high level.",
      focus:
        "Probe for concrete systems, real trade-offs, and ownership over production outcomes.",
    },
    skills: [
      {
        id: "be-systems-design",
        label: "Systems design and data modeling trade-offs",
        tier: "essential",
        dimension: "technical",
      },
      {
        id: "be-reliability",
        label: "Reliability, failure modes, and observability",
        tier: "essential",
        dimension: "technical",
      },
      {
        id: "be-ownership",
        label: "Owns services end-to-end in production",
        tier: "essential",
        dimension: "ownership",
      },
      {
        id: "be-api-design",
        label: "API design and versioning discipline",
        tier: "good_to_have",
        dimension: "technical",
      },
      {
        id: "be-collaboration",
        label: "Communicates trade-offs clearly with teammates",
        tier: "good_to_have",
        dimension: "culture",
      },
    ],
    questions: [
      {
        id: "be-q1",
        category: "technical",
        text: "Walk me through a backend system you designed. What were the hardest data-modeling decisions?",
      },
      {
        id: "be-q2",
        category: "technical",
        text: "Tell me about a production incident you handled. What failed, and what changed afterwards?",
      },
      {
        id: "be-q3",
        category: "ownership",
        text: "Describe a service you owned end-to-end. What did ownership involve day to day?",
      },
      {
        id: "be-q4",
        category: "culture",
        text: "Tell me about an architecture disagreement with a teammate. How was it resolved?",
      },
    ],
    redFlags: [
      {
        id: "be-buzzword-bluff",
        dimension: "technical",
        label: "Uses architecture terms without explaining the trade-off",
        type: "red_flag",
        weight: -20,
      },
      {
        id: "be-no-ownership",
        dimension: "ownership",
        label: "Avoids responsibility for production outcomes",
        type: "red_flag",
        weight: -15,
      },
    ],
  },
  {
    slug: "product-designer",
    title: "Product Designer",
    description:
      "Shape product experiences from discovery through interaction design and delivery with engineering.",
    persona: {
      name: "Elena",
      tone: "Curious, practical, and focused on product reasoning over visual polish alone.",
      focus:
        "Probe for discovery quality, design trade-offs, systems thinking, and collaboration.",
    },
    skills: [
      {
        id: "pd-problem-framing",
        label: "Frames user problems before jumping to UI",
        tier: "essential",
        dimension: "technical",
      },
      {
        id: "pd-interaction-quality",
        label: "Explains interaction decisions and usability trade-offs",
        tier: "essential",
        dimension: "technical",
      },
      {
        id: "pd-cross-functional",
        label: "Works well with product, engineering, and research",
        tier: "essential",
        dimension: "culture",
      },
      {
        id: "pd-design-systems",
        label: "Uses systems and constraints to scale design quality",
        tier: "good_to_have",
        dimension: "ownership",
      },
    ],
    questions: [
      {
        id: "pd-q1",
        category: "technical",
        text: "Pick a product you designed. What user problem was it solving, and how did you know?",
      },
      {
        id: "pd-q2",
        category: "technical",
        text: "Tell me about an interaction you redesigned. What trade-offs did you weigh?",
      },
      {
        id: "pd-q3",
        category: "ownership",
        text: "Describe a time a design shipped and underperformed. What did you do next?",
      },
      {
        id: "pd-q4",
        category: "culture",
        text: "Tell me about pushback you received from engineering. How did you handle it?",
      },
    ],
    redFlags: [
      {
        id: "pd-aesthetics-only",
        dimension: "technical",
        label: "Focuses only on aesthetics with weak usability reasoning",
        type: "red_flag",
        weight: -20,
      },
      {
        id: "pd-no-feedback",
        dimension: "culture",
        label: "Resists critique or user feedback",
        type: "red_flag",
        weight: -15,
      },
    ],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    description:
      "Turn business questions into trusted analysis with SQL, metric judgment, and clear communication.",
    persona: {
      name: "Noah",
      tone: "Calm, precise, and careful about assumptions before conclusions.",
      focus:
        "Probe for metric design, SQL reasoning, data quality checks, and stakeholder clarity.",
    },
    skills: [
      {
        id: "da-sql-reasoning",
        label: "SQL and data-modeling reasoning",
        tier: "essential",
        dimension: "technical",
      },
      {
        id: "da-metric-judgment",
        label: "Defines metrics and denominators carefully",
        tier: "essential",
        dimension: "technical",
      },
      {
        id: "da-data-quality",
        label: "Checks freshness, completeness, and bias",
        tier: "essential",
        dimension: "ownership",
      },
      {
        id: "da-communication",
        label: "Explains findings clearly to business partners",
        tier: "good_to_have",
        dimension: "culture",
      },
    ],
    questions: [
      {
        id: "da-q1",
        category: "technical",
        text: "Tell me about an analysis you are proud of. How did you translate the question into queries?",
      },
      {
        id: "da-q2",
        category: "technical",
        text: "How do you choose the denominator for a conversion metric?",
      },
      {
        id: "da-q3",
        category: "ownership",
        text: "Tell me about a time the data was incomplete or wrong. How did you notice?",
      },
      {
        id: "da-q4",
        category: "culture",
        text: "Describe explaining a complex finding to a non-technical stakeholder.",
      },
    ],
    redFlags: [
      {
        id: "da-overclaims",
        dimension: "culture",
        label: "Overclaims causality from weak evidence",
        type: "red_flag",
        weight: -20,
      },
      {
        id: "da-ignores-quality",
        dimension: "ownership",
        label: "Ignores data quality problems",
        type: "red_flag",
        weight: -15,
      },
    ],
  },
];

async function seed() {
  for (const job of seedJobs) {
    const row: NewJobRow = {
      id: randomUUID(),
      slug: job.slug,
      title: job.title,
      description: job.description,
      persona: job.persona,
      skills: job.skills,
      questions: job.questions,
      rubric: deriveRubric(job.skills, job.redFlags),
    };

    await db
      .insert(jobs)
      .values(row)
      .onConflictDoUpdate({
        target: jobs.slug,
        set: {
          title: row.title,
          description: row.description,
          persona: row.persona,
          skills: row.skills,
          questions: row.questions,
          rubric: row.rubric,
        },
      });

    console.log(`[seed] upserted job "${job.slug}"`);
  }

  console.log(`[seed] done (${seedJobs.length} jobs)`);
  process.exit(0);
}

seed().catch((error: unknown) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
