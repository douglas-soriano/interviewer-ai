import { apiResponse } from "@/lib/apiResponse";
import { toClientSession } from "@/lib/serializers";
import { buildSessionPanel } from "@/services/interview/buildSessionPanel";
import { loadSession } from "@/services/interview/loadSession";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await loadSession(id);

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
