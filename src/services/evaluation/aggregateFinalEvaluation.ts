import type { Decision, FinalEvaluation } from "@/domain/interview";
import type { Job, Turn } from "@/domain/session";
import { computeSkillCoverage } from "./computeSkillCoverage";
import { HIT_THRESHOLD, scoreSignals } from "./scoreSignals";

export function aggregateFinalEvaluation(
  job: Job,
  turns: Turn[],
): FinalEvaluation {
  const decisions = turns
    .map((turn) => turn.decision)
    .filter((decision): decision is Decision => decision !== null);
  const scores = scoreSignals(job.rubric, decisions);
  const coverage = computeSkillCoverage(job.skills, scores.criteria);

  const strengths = coverage
    .filter((skill) => skill.status === "demonstrated")
    .sort((left, right) => right.strength - left.strength)
    .map((skill) => skill.label);

  const redFlagConcerns = scores.criteria
    .filter(
      (criterion) =>
        criterion.type === "red_flag" && criterion.strength >= HIT_THRESHOLD,
    )
    .sort((left, right) => left.contribution - right.contribution)
    .map((criterion) => criterion.label);

  const gapConcerns = coverage
    .filter((skill) => skill.status === "gap" && skill.tier !== "bonus")
    .map((skill) => skill.label);

  return {
    overallScore: scores.overall,
    dimensions: scores.dimensions,
    strengths,
    concerns: [...redFlagConcerns, ...gapConcerns],
    coveredTopics: coverage
      .filter((skill) => skill.status !== "gap")
      .map((skill) => skill.label),
    remainingGaps: coverage
      .filter((skill) => skill.status === "gap")
      .map((skill) => skill.label),
  };
}
