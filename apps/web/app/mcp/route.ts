import { handleInstagramInsightsMcpRequest } from "@instagram-insights/mcp";

import { getAppUrl } from "@/lib/app-url";
import { requireMcpAccess } from "@/lib/mcp-oauth";
import { getPostHogClient } from "@/lib/posthog-server";
import { queueInstagramSync } from "@/lib/sync-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function summarizeAnalyticsPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const entries = Object.entries(record);

  return {
    keys: entries.map(([key]) => key),
    item_count:
      Array.isArray(record.items) || Array.isArray(record.contents)
        ? ((record.items ?? record.contents) as unknown[]).length
        : undefined,
    error:
      typeof record.error === "string" ? record.error : undefined,
  };
}

async function handleRequest(request: Request) {
  const authResult = await requireMcpAccess(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const appUrl = await getAppUrl();

  return handleInstagramInsightsMcpRequest(request, {
    userId: authResult.auth.userId,
    appUrl,
    trackToolCall: async ({ toolName, userId, status, input, output, error }) => {
      getPostHogClient().capture({
        distinctId: userId,
        event: `mcp_tool_${status}`,
        properties: {
          tool_name: toolName,
          input: summarizeAnalyticsPayload(input),
          output: summarizeAnalyticsPayload(output),
          error,
        },
      });
    },
    triggerSync: async ({ userId, force = false, staleAfterHours = 24 }) => {
      return (
        await queueInstagramSync({
          userId,
          triggerType: "developer_api",
          force,
          staleAfterHours,
        })
      ).body;
    },
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
