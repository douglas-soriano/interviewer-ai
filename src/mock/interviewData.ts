import type {
  DecisionPanel,
  FinalEvaluation,
} from "@/domain/interview";
import type { InterviewHistoryItem, PublicJob } from "@/domain/session";
import type { ClientTurn } from "@/lib/serializers";

export const mockJobs: PublicJob[] = [
  {
    id: "backend-engineer",
    slug: "backend-engineer",
    title: "Senior Backend Engineer",
    description:
      "Own APIs, data modeling, reliability work, and the trade-offs behind production systems.",
    essentialSkills: [
      "Systems design",
      "Reliability",
      "Production ownership",
    ],
  },
  {
    id: "product-designer",
    slug: "product-designer",
    title: "Product Designer",
    description:
      "Shape product experiences from discovery through interaction design and delivery.",
    essentialSkills: ["Problem framing", "Interaction quality", "Team critique"],
  },
  {
    id: "data-analyst",
    slug: "data-analyst",
    title: "Data Analyst",
    description:
      "Turn messy business questions into trusted analysis, clear metrics, and decisions.",
    essentialSkills: ["SQL reasoning", "Metric judgment", "Data quality"],
  },
];

export const mockHistory: InterviewHistoryItem[] = [
  {
    id: "mock",
    jobTitle: "Senior Backend Engineer",
    status: "completed",
    createdAt: new Date("2026-07-10T14:10:00Z"),
    completedAt: new Date("2026-07-10T14:34:00Z"),
    questionsAsked: 6,
    answeredQuestions: 6,
    overallScore: 78,
  },
];

export const mockTurns: ClientTurn[] = [
  {
    index: 0,
    questionText:
      "Walk me through a backend system you designed. What were the hardest data-modeling choices?",
    questionType: "opening",
    answerTranscript:
      "I designed a tenant-aware billing service. The main decision was keeping invoice events append-only while projecting balances for reads.",
    decision: {
      nextQuestion:
        "What failure mode did you plan for first, and how did the service behave during partial outages?",
      questionType: "follow_up",
      questionSource: "generated",
      signals: [
        {
          criterionId: "be-systems-design",
          dimension: "technical",
          polarity: "positive",
          strength: 0.78,
          evidence: "Explained event storage and read projections.",
        },
        {
          criterionId: "be-ownership",
          dimension: "ownership",
          polarity: "positive",
          strength: 0.65,
          evidence: "Described owning the billing service design.",
        },
      ],
      reasoning:
        "The answer showed system design depth. The next question probes operational behavior under failure.",
      guardrail: null,
      shouldEnd: false,
    },
    createdAt: "2026-07-10T14:11:00Z",
  },
  {
    index: 1,
    questionText:
      "What failure mode did you plan for first, and how did the service behave during partial outages?",
    questionType: "follow_up",
    answerTranscript:
      "The risky path was payment provider latency. We moved provider calls behind a queue, kept idempotency keys, and surfaced pending states to support.",
    decision: {
      nextQuestion:
        "Tell me about a production incident where you had to change the system after learning from it.",
      questionType: "topic_shift",
      questionSource: "bank",
      signals: [
        {
          criterionId: "be-reliability",
          dimension: "technical",
          polarity: "positive",
          strength: 0.82,
          evidence: "Covered queueing, idempotency, and degraded states.",
        },
      ],
      reasoning:
        "Reliability evidence is strong enough to shift toward incident ownership.",
      guardrail: null,
      shouldEnd: false,
    },
    createdAt: "2026-07-10T14:16:00Z",
  },
  {
    index: 2,
    questionText:
      "Tell me about a production incident where you had to change the system after learning from it.",
    questionType: "topic_shift",
    answerTranscript: null,
    decision: null,
    createdAt: "2026-07-10T14:21:00Z",
  },
];

export const mockPanel: DecisionPanel = {
  dimensions: [
    { dimension: "technical", score: 82, positives: 3, redFlags: 0 },
    { dimension: "ownership", score: 68, positives: 1, redFlags: 0 },
    { dimension: "culture", score: 42, positives: 0, redFlags: 0 },
  ],
  skills: [
    {
      skillId: "be-systems-design",
      label: "Systems design",
      tier: "essential",
      dimension: "technical",
      status: "demonstrated",
      strength: 0.78,
    },
    {
      skillId: "be-reliability",
      label: "Reliability",
      tier: "essential",
      dimension: "technical",
      status: "demonstrated",
      strength: 0.82,
    },
    {
      skillId: "be-ownership",
      label: "Production ownership",
      tier: "essential",
      dimension: "ownership",
      status: "partial",
      strength: 0.65,
    },
    {
      skillId: "be-collaboration",
      label: "Team communication",
      tier: "good_to_have",
      dimension: "culture",
      status: "gap",
      strength: 0,
    },
  ],
  reasoning:
    "The interview has enough technical evidence. The next question should test ownership after a real incident.",
  lastGuardrail: null,
  questionsAsked: 3,
  followUps: 1,
};

export const mockEvaluation: FinalEvaluation = {
  overallScore: 78,
  dimensions: [
    { dimension: "technical", score: 84, positives: 4, redFlags: 0 },
    { dimension: "ownership", score: 76, positives: 2, redFlags: 0 },
    { dimension: "culture", score: 67, positives: 1, redFlags: 0 },
  ],
  strengths: [
    "Explained concrete reliability trade-offs with provider latency.",
    "Used clear data-modeling language around append-only event history.",
    "Showed practical ownership by connecting system behavior to support impact.",
  ],
  concerns: [
    "Needs more evidence on collaboration during architecture disagreement.",
    "Could be more specific about incident metrics and alert thresholds.",
  ],
  coveredTopics: ["Systems design", "Reliability", "Production ownership"],
  remainingGaps: ["Mentoring", "Cross-team architecture communication"],
};

export const mockEditorJob = {
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
    ["Systems design and data modeling", "Essential", "Technical"],
    ["Reliability and failure modes", "Essential", "Technical"],
    ["Owns production services", "Essential", "Ownership"],
    ["API design and versioning", "Good to have", "Technical"],
  ],
  questions: [
    ["Technical", "Walk me through a backend system you designed."],
    ["Ownership", "Describe a service you owned end-to-end."],
    ["Culture", "Tell me about an architecture disagreement."],
  ],
};
