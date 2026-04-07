import { getInstagramSyncRunDetailById } from "@instagram-insights/db";

import {
  createJsonResponse,
  requireDeveloperApiKey,
} from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    syncRunId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireDeveloperApiKey(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const { syncRunId } = await context.params;
  const response = await getInstagramSyncRunDetailById({
    syncRunId,
    userId: authResult.auth.userId,
  });

  if (!response.syncRun) {
    return createJsonResponse(
      { error: "Sync run not found." },
      { status: 404 },
    );
  }

  return createJsonResponse(response);
}
