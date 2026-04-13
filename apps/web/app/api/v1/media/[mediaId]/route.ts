import { getInstagramMediaDetailById } from "@instasights/db";

import {
  createJsonResponse,
  requireApiAccess,
} from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    mediaId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireApiAccess(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { mediaId } = await context.params;
  const response = await getInstagramMediaDetailById({
    mediaId,
    userId: authResult.auth.userId,
  });

  if (!response.media) {
    return createJsonResponse({ error: "Media not found." }, { status: 404 });
  }

  return createJsonResponse(response);
}
