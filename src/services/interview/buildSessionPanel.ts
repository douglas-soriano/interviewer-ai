import type {
  Decision,
  DecisionPanel,
  Dimension,
  GuardrailFlag,
  JobSkill,
  Signal,
  SkillCoverage,
} from "@/domain/interview";
import type { Job, Turn } from "@/domain/session";

function strongestPositiveByCriterion(decisions: Decision[]): Map<string, number> {
  const strengths = new Map<string, number>();

  for (const decision of decisions) {
    for (const signal of decision.signals) {
      if (signal.polarity !== "positive") {
        continue;
      }

      const current = strengths.get(signal.criterionId) ?? 0;
      if (signal.strength > current) {
        strengths.set(signal.criterionId, signal.strength);
      }
    }
  }

  return strengths;
}

function toSkillCoverage(
  skill: JobSkill,
  strength: number,
): SkillCoverage {
  const status =
    strength >= 0.6 ? "demonstrated" : strength > 0 ? "partial" : "gap";

  return {
    skillId: skill.id,
    label: skill.label,
    tier: skill.tier,
    dimension: skill.dimension,
    status,
    strength,
  };
}

function collectDimensionMetrics(
  signals: Signal[],
  dimension: Dimension,
): { score: number; positives: number; redFlags: number } {
  const matches = signals.filter((signal) => signal.dimension === dimension);
  const positives = matches.filter((signal) => signal.polarity === "positive");
  const redFlags = matches.filter((signal) => signal.polarity === "red_flag");
  const positiveScore = positives.reduce(
    (sum, signal) => sum + Math.round(signal.strength * 28),
    0,
  );
  const redFlagPenalty = redFlags.reduce(
    (sum, signal) => sum + Math.max(8, Math.round(signal.strength * 18)),
    0,
  );

  return {
    score: Math.max(0, Math.min(100, positiveScore - redFlagPenalty)),
    positives: positives.length,
    redFlags: redFlags.length,
  };
}

function latestGuardrail(decisions: Decision[]): GuardrailFlag | null {
  for (let index = decisions.length - 1; index >= 0; index -= 1) {
    if (decisions[index].guardrail) {
      return decisions[index].guardrail;
    }
  }

  return null;
}

export function buildSessionPanel(job: Job, turns: Turn[]): DecisionPanel {
  const decisions = turns
    .map((turn) => turn.decision)
    .filter((decision): decision is Decision => decision !== null);
  const allSignals = decisions.flatMap((decision) => decision.signals);
  const strengthByCriterion = strongestPositiveByCriterion(decisions);
  const skills = job.skills.map((skill) =>
    toSkillCoverage(skill, strengthByCriterion.get(skill.id) ?? 0),
  );
  const dimensions = (["technical", "ownership", "culture"] as const).map(
    (dimension) => ({
      dimension,
      ...collectDimensionMetrics(allSignals, dimension),
    }),
  );

  const lastGuardrail = latestGuardrail(decisions);
  const unanswered = skills.filter((skill) => skill.status === "gap").length;

  return {
    dimensions,
    skills,
    reasoning:
      decisions.length === 0
        ? "The interview has not collected any answer yet."
        : lastGuardrail
          ? `The latest answer triggered a ${lastGuardrail.type.replace("_", " ")} guardrail.`
          : unanswered === 0
            ? "All registered skills have at least some evidence."
            : `${unanswered} registered skills still need stronger evidence.`,
    lastGuardrail,
    questionsAsked: turns.length,
    followUps: turns.filter((turn) => turn.questionType === "follow_up").length,
  };
}
