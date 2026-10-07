import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import {
  ConversationEvalSuiteSchema,
  compareToHuman,
  summarizeEvalResults,
  type EvalSummary,
} from "./conversationEval";
import { judgeConversation } from "./llmConversationJudge";

const MAX_MEAN_RATING_DROP = 0.25;
const MAX_AGREEMENT_DROP = 0.05;
const MAX_DELTA_INCREASE = 0.2;

function option(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

async function loadJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function compareBaseline(current: EvalSummary, baseline: EvalSummary): string[] {
  const failures: string[] = [];

  if (baseline.meanJudgeRating - current.meanJudgeRating > MAX_MEAN_RATING_DROP) {
    failures.push(
      `mean judge rating dropped from ${baseline.meanJudgeRating.toFixed(2)} to ${current.meanJudgeRating.toFixed(2)}`,
    );
  }

  if (
    baseline.passAgreementRate - current.passAgreementRate >
    MAX_AGREEMENT_DROP
  ) {
    failures.push(
      `judge/human pass agreement dropped from ${(
        baseline.passAgreementRate * 100
      ).toFixed(1)}% to ${(current.passAgreementRate * 100).toFixed(1)}%`,
    );
  }

  if (
    current.meanAbsoluteRatingDelta - baseline.meanAbsoluteRatingDelta >
    MAX_DELTA_INCREASE
  ) {
    failures.push(
      `judge/human rating delta increased from ${baseline.meanAbsoluteRatingDelta.toFixed(2)} to ${current.meanAbsoluteRatingDelta.toFixed(2)}`,
    );
  }

  return failures;
}

async function main() {
  const suitePath = option("--suite") ?? "evals/conversation-cases.json";
  const baselinePath = option("--baseline");
  const writeBaselinePath = option("--write-baseline");
  const outputPath = option("--output") ?? "evals/latest-results.json";

  const suite = ConversationEvalSuiteSchema.parse(await loadJson(suitePath));
  const calibration = suite.filter((testCase) => testCase.kind === "calibration");
  const regression = suite.filter((testCase) => testCase.kind === "regression");

  if (calibration.length === 0) {
    throw new Error(
      "At least one human-labeled calibration case is required for LLM-as-judge alignment.",
    );
  }

  if (regression.length === 0) {
    throw new Error("At least one regression case is required.");
  }

  const results = [];

  for (const testCase of regression) {
    const startedAt = Date.now();
    const judge = await judgeConversation(testCase, calibration);
    const latencyMs = Date.now() - startedAt;
    const result = compareToHuman(testCase, judge, latencyMs);
    results.push(result);

    console.info("[eval]", {
      id: testCase.id,
      passAgreement: result.passAgreement,
      ratingDelta: result.meanAbsoluteRatingDelta.toFixed(2),
      latencyMs,
    });
  }

  const summary = summarizeEvalResults(results);
  await writeFile(
    outputPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, results }, null, 2) +
      "\n",
    "utf8",
  );

  console.info("[eval] summary", summary);
  console.info(`[eval] wrote ${outputPath}`);

  if (writeBaselinePath) {
    await writeFile(
      writeBaselinePath,
      JSON.stringify(summary, null, 2) + "\n",
      "utf8",
    );
    console.info(`[eval] baseline written to ${writeBaselinePath}`);
  }

  if (baselinePath) {
    const baseline = (await loadJson(baselinePath)) as EvalSummary;
    const failures = compareBaseline(summary, baseline);

    if (failures.length > 0) {
      console.error("[eval] regression gate failed");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exit(1);
    }

    console.info("[eval] regression gate passed");
  }
}

main().catch((error: unknown) => {
  console.error("[eval] failed", error instanceof Error ? error.message : error);
  process.exit(1);
});
