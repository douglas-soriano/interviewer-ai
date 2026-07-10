import type {
  BankQuestion,
  Decision,
  FinalEvaluation,
  JobSkill,
  Persona,
  QuestionType,
  Rubric,
} from "./interview";

export interface Job {
  id: string;
  slug: string;
  title: string;
  description: string;
  persona: Persona;
  skills: JobSkill[];
  questions: BankQuestion[];
  rubric: Rubric;
  createdAt: Date;
}

export interface PublicJob {
  id: string;
  slug: string;
  title: string;
  description: string;
  essentialSkills: string[];
}

export interface Turn {
  id: string;
  sessionId: string;
  index: number;
  questionText: string;
  questionType: QuestionType;
  answerTranscript: string | null;
  decision: Decision | null;
  createdAt: Date;
}

export type SessionStatus = "in_progress" | "completed";

export interface Session {
  id: string;
  jobId: string;
  status: SessionStatus;
  finalEvaluation: FinalEvaluation | null;
  createdAt: Date;
  completedAt: Date | null;
  turns: Turn[];
  job?: Job;
}

export interface InterviewHistoryItem {
  id: string;
  jobTitle: string;
  status: SessionStatus;
  createdAt: Date;
  completedAt: Date | null;
  questionsAsked: number;
  answeredQuestions: number;
  overallScore: number | null;
}
