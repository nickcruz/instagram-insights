import { listInstagramSyncRunsByUserId } from "@instagram-insights/db";

import {
  createJsonResponse,
  requireDeveloperApiKey,
} from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireDeveloperApiKey(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor");

  return createJsonResponse(
    await listInstagramSyncRunsByUserId({
      userId: authResult.auth.userId,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      cursor,
    }),
  );
}
