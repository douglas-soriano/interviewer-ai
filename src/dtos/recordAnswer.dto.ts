import { z } from "zod";

export const RecordAnswerSchema = z.object({
  turnIndex: z.number().int().nonnegative(),
  transcript: z.string().trim().min(1, "transcript is empty").max(20000),
});

export type RecordAnswerInput = z.infer<typeof RecordAnswerSchema>;
