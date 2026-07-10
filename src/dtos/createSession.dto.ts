import { z } from "zod";

export const CreateSessionSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
