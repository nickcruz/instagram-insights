import {
  getAccountOverviewByUserId,
  getInstagramMediaDetailById,
  getInstagramSyncRunDetailById,
  getLatestSnapshotByUserId,
  listInstagramMediaByUserId,
  listInstagramSyncRunsByUserId,
} from "@instagram-insights/db";
import {
  getInstagramSchemaTableDoc,
  instagramSchemaOverview,
  instagramSchemaTables,
} from "@instagram-insights/contracts";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

type McpContext = {
  userId: string;
  triggerSync?: (input: {
    userId: string;
    force?: boolean;
    staleAfterHours?: number;
  }) => Promise<Record<string, unknown>>;
  trackToolCall?: (event: {
    toolName: string;
    userId: string;
    status: "started" | "succeeded" | "failed";
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
  }) => void | Promise<void>;
};

function jsonText(data: unknown) {
  return JSON.stringify(data, null, 2);
}

function jsonResult<T extends Record<string, unknown>>(data: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: jsonText(data),
      },
    ],
    structuredContent: data,
  };
}

async function trackToolCall(
  context: McpContext,
  event: Parameters<NonNullable<McpContext["trackToolCall"]>>[0],
) {
  await context.trackToolCall?.(event);
}

function withToolTracking<TInput extends Record<string, unknown> | void>(
  context: McpContext,
  toolName: string,
  handler: (input: TInput) => Promise<ReturnType<typeof jsonResult>>,
) {
  return async (input: TInput) => {
    await trackToolCall(context, {
      toolName,
      userId: context.userId,
      status: "started",
      input: (input ?? undefined) as Record<string, unknown> | undefined,
    });

    try {
      const result = await handler(input);

      await trackToolCall(context, {
        toolName,
        userId: context.userId,
        status: "succeeded",
        input: (input ?? undefined) as Record<string, unknown> | undefined,
        output:
          result.structuredContent && typeof result.structuredContent === "object"
            ? (result.structuredContent as Record<string, unknown>)
            : undefined,
      });

      return result;
    } catch (error) {
      await trackToolCall(context, {
        toolName,
        userId: context.userId,
        status: "failed",
        input: (input ?? undefined) as Record<string, unknown> | undefined,
        error: error instanceof Error ? error.message : "Unknown MCP tool error.",
      });

      throw error;
    }
  };
}

function createInstagramInsightsMcpServer(context: McpContext) {
  const server = new McpServer(
    {
      name: "instagram-insights",
      version: "0.1.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  server.registerTool(
    "get_account_overview",
    {
      title: "Get Account Overview",
      description:
        "Return the linked Instagram account summary and the latest sync run for the authenticated user.",
    },
    withToolTracking(context, "get_account_overview", async () =>
      jsonResult(await getAccountOverviewByUserId(context.userId)),
    ),
  );

  server.registerTool(
    "get_latest_snapshot",
    {
      title: "Get Latest Snapshot",
      description:
        "Return the latest normalized account snapshot for the authenticated user.",
    },
    withToolTracking(context, "get_latest_snapshot", async () =>
      jsonResult(await getLatestSnapshotByUserId(context.userId)),
    ),
  );

  server.registerTool(
    "list_media",
    {
      title: "List Media",
      description:
        "List ingested Instagram media for the authenticated user with optional filters and cursor pagination. For eligible video media, transcript fields represent the opening ~30 seconds of audio, which should be treated as the hook or opener rather than a full-video transcript.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
        mediaType: z.string().optional(),
        since: z.string().optional(),
        until: z.string().optional(),
      }),
    },
    withToolTracking(context, "list_media", async (input) =>
      jsonResult(
        await listInstagramMediaByUserId({
          userId: context.userId,
          ...input,
        }),
      ),
    ),
  );

  server.registerTool(
    "get_media",
    {
      title: "Get Media",
      description:
        "Return one ingested Instagram media record for the authenticated user. For eligible video media, transcriptText is the opening ~30 seconds of audio and is intended to capture the hook or first spoken lines, not the full asset.",
      inputSchema: z.object({
        mediaId: z.string(),
      }),
    },
    withToolTracking(context, "get_media", async ({ mediaId }) =>
      jsonResult(
        await getInstagramMediaDetailById({
          mediaId,
          userId: context.userId,
        }),
      ),
    ),
  );

  server.registerTool(
    "list_sync_runs",
    {
      title: "List Sync Runs",
      description:
        "List background Instagram sync runs for the authenticated user with cursor pagination.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
      }),
    },
    withToolTracking(context, "list_sync_runs", async (input) =>
      jsonResult(
        await listInstagramSyncRunsByUserId({
          userId: context.userId,
          ...input,
        }),
      ),
    ),
  );

  server.registerTool(
    "get_sync_run",
    {
      title: "Get Sync Run",
      description:
        "Return one background Instagram sync run, including its persisted normalized report when available.",
      inputSchema: z.object({
        syncRunId: z.string(),
      }),
    },
    withToolTracking(context, "get_sync_run", async ({ syncRunId }) =>
      jsonResult(
        await getInstagramSyncRunDetailById({
          syncRunId,
          userId: context.userId,
        }),
      ),
    ),
  );

  server.registerTool(
    "trigger_sync",
    {
      title: "Trigger Sync",
      description:
        "Queue a new Instagram full sync for the authenticated user. If force is false, the tool may reuse an already-active run or skip queueing when the latest sync is fresh enough.",
      inputSchema: z.object({
        force: z.boolean().optional(),
        staleAfterHours: z.number().int().min(1).max(24 * 30).optional(),
      }),
    },
    withToolTracking(context, "trigger_sync", async (input) => {
      if (!context.triggerSync) {
        return jsonResult({
          error: "Sync triggering is not enabled for this MCP server.",
        });
      }

      return jsonResult(
        await context.triggerSync({
          userId: context.userId,
          force: input.force,
          staleAfterHours: input.staleAfterHours,
        }),
      );
    }),
  );

  server.registerResource(
    "schema-overview",
    "schema://overview",
    {
      title: "Schema Overview",
      description: "Overview of the curated Instagram analytics schema surface.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "schema://overview",
          mimeType: "application/json",
          text: jsonText(instagramSchemaOverview),
        },
      ],
    }),
  );

  server.registerResource(
    "schema-tables",
    "schema://tables",
    {
      title: "Schema Tables",
      description: "Full table documentation for the MCP schema resources.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "schema://tables",
          mimeType: "application/json",
          text: jsonText(instagramSchemaTables),
        },
      ],
    }),
  );

  server.registerResource(
    "schema-table",
    new ResourceTemplate("schema://table/{tableName}", {
      list: async () => ({
        resources: instagramSchemaTables.map((table) => ({
          uri: `schema://table/${table.name}`,
          name: table.name,
          title: table.title,
          description: table.description,
          mimeType: "application/json",
        })),
      }),
    }),
    {
      title: "Schema Table",
      description: "Documentation for one Instagram analytics table.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const tableName = Array.isArray(variables.tableName)
        ? variables.tableName[0]
        : variables.tableName;
      const tableDoc = tableName
        ? getInstagramSchemaTableDoc(tableName)
        : null;

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: jsonText(
              tableDoc ?? {
                error: `Unknown schema table: ${tableName ?? "undefined"}`,
              },
            ),
          },
        ],
      };
    },
  );

  return server;
}

export async function handleInstagramInsightsMcpRequest(
  request: Request,
  context: McpContext,
) {
  const server = createInstagramInsightsMcpServer(context);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  transport.onclose = () => {
    void server.close();
  };

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/event-stream")) {
      await server.close();
    }

    return response;
  } catch (error) {
    await server.close();
    throw error;
  }
}
