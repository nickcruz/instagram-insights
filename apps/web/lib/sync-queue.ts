import {
  createInstagramSyncRun,
  getInstagramAccountByUserId,
  getLatestActiveInstagramSyncRunByUserId,
  getLatestInstagramSyncRun,
  markInstagramSyncRunFailed,
  serializeSyncRunSummary,
  updateInstagramSyncRunProgress,
} from "@instasights/db";
import { start } from "workflow/api";

import { instagramFullSyncWorkflow } from "@/workflows/instagram-full-sync";

export type QueueInstagramSyncResult =
  | {
      statusCode: 400;
      body: {
        error: string;
      };
    }
  | {
      statusCode: 200;
      body: {
        syncRun: ReturnType<typeof serializeSyncRunSummary>;
        reusedExistingRun: boolean;
        queuedNewRun: false;
        reason: string;
      };
    }
  | {
      statusCode: 202;
      body: {
        syncRunId: string;
        workflowRunId: string;
        status: "queued";
        queuedNewRun: true;
        reusedExistingRun: false;
        syncRun: ReturnType<typeof serializeSyncRunSummary> | null;
      };
    }
  | {
      statusCode: 500;
      body: {
        error: string;
        queuedNewRun: false;
        reusedExistingRun: false;
      };
    };

export async function queueInstagramSync(input: {
  userId: string;
  triggerType: "manual" | "scheduled" | "developer_api";
  force?: boolean;
  staleAfterHours?: number;
}): Promise<QueueInstagramSyncResult> {
  const instagramAccount = await getInstagramAccountByUserId(input.userId);

  if (!instagramAccount) {
    return {
      statusCode: 400,
      body: {
        error: "No linked Instagram account found for this user.",
      },
    };
  }

  const force = input.force === true;
  const staleAfterHours = Math.max(1, input.staleAfterHours ?? 24);

  if (!force) {
    const activeRun = await getLatestActiveInstagramSyncRunByUserId(input.userId);

    if (activeRun) {
      return {
        statusCode: 200,
        body: {
          syncRun: serializeSyncRunSummary(activeRun),
          reusedExistingRun: true,
          queuedNewRun: false,
          reason: "An Instagram sync is already queued or running.",
        },
      };
    }

    const latestRun = await getLatestInstagramSyncRun(input.userId);

    if (latestRun?.completedAt) {
      const ageMs = Date.now() - latestRun.completedAt.getTime();
      const staleAfterMs = staleAfterHours * 60 * 60 * 1000;

      if (ageMs < staleAfterMs) {
        return {
          statusCode: 200,
          body: {
            syncRun: serializeSyncRunSummary(latestRun),
            reusedExistingRun: false,
            queuedNewRun: false,
            reason: `Latest sync is newer than ${staleAfterHours} hours.`,
          },
        };
      }
    }
  }

  const syncRun = await createInstagramSyncRun({
    userId: input.userId,
    instagramAccountId: instagramAccount.id,
    triggerType: input.triggerType,
  });

  try {
    const run = await start(instagramFullSyncWorkflow, [
      {
        syncRunId: syncRun.id,
        userId: input.userId,
        instagramAccountId: instagramAccount.id,
        triggerType: input.triggerType,
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

    const queuedRun = await getLatestInstagramSyncRun(input.userId);

    return {
      statusCode: 202,
      body: {
        syncRunId: syncRun.id,
        workflowRunId: run.runId,
        status: "queued",
        queuedNewRun: true,
        reusedExistingRun: false,
        syncRun: queuedRun ? serializeSyncRunSummary(queuedRun) : null,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Instagram sync failed.";

    await markInstagramSyncRunFailed({
      runId: syncRun.id,
      error: message,
      currentStep: "queue",
      progressPercent: 0,
    });

    return {
      statusCode: 500,
      body: {
        error: message,
        queuedNewRun: false,
        reusedExistingRun: false,
      },
    };
  }
}
