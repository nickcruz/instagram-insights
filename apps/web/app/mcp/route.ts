import { handleInstagramInsightsMcpRequest } from "@instagram-insights/mcp";

import { requireDeveloperApiKey } from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const authResult = await requireDeveloperApiKey(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  return handleInstagramInsightsMcpRequest(request, {
    userId: authResult.auth.userId,
  });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

export async function DELETE(request: Request) {
  return handleRequest(request);
}
