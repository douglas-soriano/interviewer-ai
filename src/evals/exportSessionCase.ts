import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { sessionRepository } from "@/repositories/sessionRepository";

async function main() {
  const sessionId = process.argv[2];
  const outputPath =
    process.argv[3] ?? `evals/session-${sessionId ?? "unknown"}.json`;

  if (!sessionId) {
    throw new Error(
      "Usage: npm run eval:export -- <session-id> [output-json-path]",
    );
  }

  const session = await sessionRepository.find(sessionId, {
    relations: ["turns", "job"],
  });

  if (!session?.job) {
    throw new Error(`Session ${sessionId} or its job was not found`);
  }

  const conversation = session.turns
    .filter(
      (turn): turn is typeof turn & { answerTranscript: string } =>
        Boolean(turn.answerTranscript?.trim()),
    )
    .map((turn) => ({
      question: turn.questionText,
      answer: turn.answerTranscript,
    }));

  if (conversation.length === 0) {
    throw new Error(`Session ${sessionId} has no answered turns`);
  }

  const draft = [
    {
      id: `session-${sessionId}`,
      sourceSessionId: sessionId,
      kind: "regression",
      role: session.job.title,
      conversation,
      human: {
        relevance: 0,
        followUpQuality: 0,
        evidenceGrounding: 0,
        coherence: 0,
        pass: false,
        notes:
          "TODO: human reviewer must replace 0 ratings with 1-5 labels before running evals.",
      },
    },
  ];

  await writeFile(outputPath, JSON.stringify(draft, null, 2) + "\n", "utf8");
  console.info(`[eval:export] wrote ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(
    "[eval:export] failed",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
