import { z } from "zod";
import type { Decision } from "@/domain/interview";
import type { Job } from "@/domain/session";
import { ProviderError } from "@/lib/errors";

const decisionSchema = z.object({
  nextQuestion: z.string().min(1),
  questionType: z.enum([
    "opening",
    "follow_up",
    "topic_shift",
    "redirect",
    "closing",
  ]),
  questionSource: z.enum(["bank", "generated"]).default("generated"),
  signals: z
    .array(
      z.object({
        criterionId: z.string(),
        dimension: z.enum(["technical", "ownership", "culture"]),
        polarity: z.enum(["positive", "red_flag"]),
        strength: z.number().min(0).max(1),
        evidence: z.string(),
      }),
    )
    .default([]),
  reasoning: z.string().default(""),
  guardrail: z
    .object({
      type: z.enum(["manipulation", "off_topic", "evasive"]),
      note: z.string(),
    })
    .nullable()
    .default(null),
  shouldEnd: z.boolean().default(false),
});

export const REPAIR_HINT =
  "Your previous reply could not be parsed. Respond again with only the JSON object, valid JSON, no markdown, no extra text.";

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new ProviderError("No JSON object found in model response");
  }

  return candidate.slice(start, end + 1);
}

export function decodeDecision(raw: string, job: Job): Decision {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    throw new ProviderError("Model response was not valid JSON");
  }

  const result = decisionSchema.safeParse(parsed);
  if (!result.success) {
    throw new ProviderError(
      `Model response failed validation: ${result.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`,
    );
  }

  const validIds = new Set(job.rubric.criteria.map((criterion) => criterion.id));
  const decision = result.data;
  decision.signals = decision.signals.filter((signal) =>
    validIds.has(signal.criterionId),
  );

  return decision;
}

export async function decodeWithRepair(
  complete: (repairHint: string | null) => Promise<string>,
  job: Job,
  retries: number,
): Promise<Decision> {
  let hint: string | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const raw = await complete(hint);

    try {
      return decodeDecision(raw, job);
    } catch (error) {
      lastError = error;
      hint = REPAIR_HINT;
      console.warn(`[decodeWithRepair] invalid decision payload on attempt ${attempt + 1}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new ProviderError(
    `Could not obtain a valid decision after ${retries + 1} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
