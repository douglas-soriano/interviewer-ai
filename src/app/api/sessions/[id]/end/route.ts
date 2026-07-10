import { apiResponse } from "@/lib/apiResponse";
import { toClientSession } from "@/lib/serializers";
import { buildSessionPanel } from "@/services/interview/buildSessionPanel";
import { endSession } from "@/services/interview/endSession";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await endSession(id);

    return apiResponse.success(
      toClientSession(
        session,
        session.job ? buildSessionPanel(session.job, session.turns) : null,
      ),
    );
  } catch (error) {
    return apiResponse.error(error);
  }
}
