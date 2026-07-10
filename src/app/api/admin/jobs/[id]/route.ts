import { JobUpsertSchema } from "@/dtos/jobUpsert.dto";
import { apiResponse } from "@/lib/apiResponse";
import { deleteJob } from "@/services/job/deleteJob";
import { loadJobById } from "@/services/job/loadJobById";
import { updateJob } from "@/services/job/saveJob";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    return apiResponse.success(await loadJobById(id));
  } catch (error) {
    return apiResponse.error(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = JobUpsertSchema.parse(await request.json());
    return apiResponse.success(await updateJob(id, input));
  } catch (error) {
    return apiResponse.error(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteJob(id);
    return apiResponse.success({ deleted: true });
  } catch (error) {
    return apiResponse.error(error);
  }
}
