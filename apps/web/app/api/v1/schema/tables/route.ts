import {
  instagramSchemaOverview,
  instagramSchemaTables,
} from "@instagram-insights/contracts";

import {
  createJsonResponse,
  requireApiAccess,
} from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireApiAccess(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  return createJsonResponse({
    overview: instagramSchemaOverview,
    tables: instagramSchemaTables,
  });
}
