import {
  createInstagramSyncRun,
  getInstagramAccountByUserId,
  getLatestActiveInstagramSyncRunByUserId,
  listInstagramSyncRunsByUserId,
  markInstagramSyncRunFailed,
  updateInstagramSyncRunProgress,
} from "@instagram-insights/db";
import { start } from "workflow/api";

import {
  createJsonResponse,
  requireDeveloperApiKey,
} from "@/lib/developer-api-auth";
import { instagramFullSyncWorkflow } from "@/workflows/instagram-full-sync";

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

export async function POST(request: Request) {
  const authResult = await requireDeveloperApiKey(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const userId = authResult.auth.userId;
  const instagramAccount = await getInstagramAccountByUserId(userId);

  if (!instagramAccount) {
    return createJsonResponse(
      { error: "No linked Instagram account found for this API key owner." },
      { status: 400 },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | { force?: unknown }
    | null;
  const force = payload?.force === true;

  if (!force) {
    const activeRun = await getLatestActiveInstagramSyncRunByUserId(userId);

    if (activeRun) {
      return createJsonResponse(
        {
          syncRun: {
            id: activeRun.id,
            instagramAccountId: activeRun.instagramAccountId,
            status: activeRun.status,
            triggerType: activeRun.triggerType ?? null,
            workflowRunId: activeRun.workflowRunId ?? null,
            currentStep: activeRun.currentStep ?? null,
            progressPercent: activeRun.progressPercent ?? null,
            statusMessage: activeRun.statusMessage ?? null,
            startedAt: activeRun.startedAt.toISOString(),
            completedAt: activeRun.completedAt?.toISOString() ?? null,
            lastHeartbeatAt: activeRun.lastHeartbeatAt?.toISOString() ?? null,
            durationSeconds: activeRun.durationSeconds ?? null,
            mediaCount: activeRun.mediaCount ?? null,
            warningCount: activeRun.warningCount ?? null,
            error: activeRun.error ?? null,
            progress:
              activeRun.progress &&
              typeof activeRun.progress === "object" &&
              !Array.isArray(activeRun.progress)
                ? activeRun.progress
                : null,
            summary:
              activeRun.summary &&
              typeof activeRun.summary === "object" &&
              !Array.isArray(activeRun.summary)
                ? activeRun.summary
                : null,
            createdAt: activeRun.createdAt.toISOString(),
            updatedAt: activeRun.updatedAt.toISOString(),
          },
          reusedExistingRun: true,
        },
        { status: 200 },
      );
    }
  }

  const syncRun = await createInstagramSyncRun({
    userId,
    instagramAccountId: instagramAccount.id,
    triggerType: "developer_api",
  });

  try {
    const run = await start(instagramFullSyncWorkflow, [
      {
        syncRunId: syncRun.id,
        userId,
        instagramAccountId: instagramAccount.id,
        triggerType: "developer_api",
      },
    ]);

    await updateInstagramSyncRunProgress({
      runId: syncRun.id,
      status: "queued",
      workflowRunId: run.runId,
      currentStep: "queued",
      progressPercent: 0,
      statusMessage: "Sync queued",
    });

    return createJsonResponse(
      {
        syncRunId: syncRun.id,
        workflowRunId: run.runId,
        status: "queued",
        reusedExistingRun: false,
      },
      { status: 202 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Instagram sync failed.";

    await markInstagramSyncRunFailed({
      runId: syncRun.id,
      error: message,
      currentStep: "queue",
      progressPercent: 0,
    });

    return createJsonResponse({ error: message }, { status: 500 });
  }
}
