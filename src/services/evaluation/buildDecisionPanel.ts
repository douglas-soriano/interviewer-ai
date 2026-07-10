import type { Decision, DecisionPanel } from "@/domain/interview";
import type { Job, Turn } from "@/domain/session";
import { computeSkillCoverage } from "./computeSkillCoverage";
import { scoreSignals } from "./scoreSignals";

export function buildDecisionPanel(job: Job, turns: Turn[]): DecisionPanel {
  const decisions = turns
    .map((turn) => turn.decision)
    .filter((decision): decision is Decision => decision !== null);
  const lastDecision = decisions.at(-1) ?? null;
  const scores = scoreSignals(job.rubric, decisions);

  return {
    dimensions: scores.dimensions,
    skills: computeSkillCoverage(job.skills, scores.criteria),
    reasoning:
      lastDecision?.reasoning ??
      "The evaluation is anchored to this job's registered skills.",
    lastGuardrail: lastDecision?.guardrail ?? null,
    questionsAsked: turns.length,
    followUps: turns.filter((turn) => turn.questionType === "follow_up").length,
  };
}
