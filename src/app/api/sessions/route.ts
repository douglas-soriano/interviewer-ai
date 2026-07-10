import { CreateSessionSchema } from "@/dtos/createSession.dto";
import { apiResponse } from "@/lib/apiResponse";
import { toClientSession } from "@/lib/serializers";
import { buildSessionPanel } from "@/services/interview/buildSessionPanel";
import { createSession } from "@/services/interview/createSession";

export async function POST(request: Request) {
  try {
    const input = CreateSessionSchema.parse(await request.json());
    const session = await createSession(input);

    return apiResponse.success(
      toClientSession(
        session,
        session.job ? buildSessionPanel(session.job, session.turns) : null,
      ),
      201,
    );
  } catch (error) {
    return apiResponse.error(error);
  }
}
