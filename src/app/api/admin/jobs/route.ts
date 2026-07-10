import { JobUpsertSchema } from "@/dtos/jobUpsert.dto";
import { apiResponse } from "@/lib/apiResponse";
import { listAdminJobs } from "@/services/job/listAdminJobs";
import { createJob } from "@/services/job/saveJob";

export async function GET() {
  try {
    return apiResponse.success(await listAdminJobs());
  } catch (error) {
    return apiResponse.error(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = JobUpsertSchema.parse(await request.json());
    return apiResponse.success(await createJob(input), 201);
  } catch (error) {
    return apiResponse.error(error);
  }
}
