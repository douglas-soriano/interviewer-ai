import { RecordAnswerSchema } from "@/dtos/recordAnswer.dto";
import { apiResponse } from "@/lib/apiResponse";
import {
  chunkText,
  SSE_HEADERS,
  SSE_TYPING_DELAY_MS,
  sseChunk,
} from "@/lib/sse";
import { recordCandidateAnswer } from "@/services/interview/recordCandidateAnswer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let input;
  try {
    input = RecordAnswerSchema.parse(await request.json());
  } catch (error) {
    return apiResponse.error(error);
  }

  let result;
  try {
    result = await recordCandidateAnswer(id, input);
  } catch (error) {
    return apiResponse.error(error);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      const question = result.completed ? "" : result.decision.nextQuestion;

      for (const token of chunkText(question)) {
        emit(sseChunk({ type: "token", value: token }));
        await new Promise((resolve) => setTimeout(resolve, SSE_TYPING_DELAY_MS));
      }

      emit(
        sseChunk({
          type: "done",
          payload: {
            completed: result.completed,
            decision: result.decision,
            panel: result.panel,
            nextTurn: result.nextTurn
              ? {
                  index: result.nextTurn.index,
                  questionText: result.nextTurn.questionText,
                  questionType: result.nextTurn.questionType,
                  createdAt: result.nextTurn.createdAt.toISOString(),
                }
              : null,
            finalEvaluation: result.finalEvaluation,
          },
        }),
      );

      controller.close();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
