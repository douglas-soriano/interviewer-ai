import { apiResponse } from "@/lib/apiResponse";
import { listJobs } from "@/services/job/listJobs";

export async function GET() {
  try {
    return apiResponse.list(await listJobs());
  } catch (error) {
    return apiResponse.error(error);
  }
}
