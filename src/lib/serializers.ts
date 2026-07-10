import type {
  Decision,
  DecisionPanel,
  FinalEvaluation,
  QuestionType,
} from "@/domain/interview";
import type { Session } from "@/domain/session";

export interface ClientTurn {
  index: number;
  questionText: string;
  questionType: QuestionType;
  answerTranscript: string | null;
  decision: Decision | null;
  createdAt: string;
}

export interface ClientSession {
  id: string;
  status: Session["status"];
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  interviewerName: string;
  turns: ClientTurn[];
  panel: DecisionPanel | null;
  finalEvaluation: FinalEvaluation | null;
}

export function toClientSession(
  session: Session,
  panel: DecisionPanel | null = null,
): ClientSession {
  return {
    id: session.id,
    status: session.status,
    jobId: session.jobId,
    jobTitle: session.job?.title ?? "",
    jobDescription: session.job?.description ?? "",
    interviewerName: session.job?.persona.name ?? "Interviewer",
    turns: session.turns.map((turn) => ({
      index: turn.index,
      questionText: turn.questionText,
      questionType: turn.questionType,
      answerTranscript: turn.answerTranscript,
      decision: turn.decision,
      createdAt: turn.createdAt.toISOString(),
    })),
    panel,
    finalEvaluation: session.finalEvaluation,
  };
}
