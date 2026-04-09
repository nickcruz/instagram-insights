import {
  listInstagramSyncRunsByUserId,
} from "@instagram-insights/db";

import {
  createJsonResponse,
  requireApiAccess,
} from "@/lib/developer-api-auth";
import { queueInstagramSync } from "@/lib/sync-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireApiAccess(request);

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

export async function POST(request: Request) {
  const authResult = await requireApiAccess(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const payload = (await request.json().catch(() => null)) as
    | { force?: unknown; staleAfterHours?: unknown }
    | null;
  const force = payload?.force === true;
  const staleAfterHours =
    typeof payload?.staleAfterHours === "number" &&
    Number.isFinite(payload.staleAfterHours)
      ? payload.staleAfterHours
      : undefined;
  const result = await queueInstagramSync({
    userId: authResult.auth.userId,
    triggerType: "developer_api",
    force,
    staleAfterHours,
  });

  return createJsonResponse(result.body, { status: result.statusCode });
}
