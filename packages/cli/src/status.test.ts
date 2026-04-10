import test from "node:test";
import assert from "node:assert/strict";

import type { AccountOverviewResponse } from "./types";
import { deriveSetupStatus } from "./status";

function baseOverview(): AccountOverviewResponse {
  return {
    status: "ready",
    account: {
      id: "acct_1",
      instagramUserId: "ig_1",
      username: "creator",
      graphApiVersion: "v25.0",
      linkedAt: new Date().toISOString(),
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    latestSyncRun: null,
  };
}

test("deriveSetupStatus returns not_linked when no account exists", () => {
  const status = deriveSetupStatus({
    overview: {
      status: "not_linked",
      account: null,
      latestSyncRun: null,
    },
    appUrl: "https://example.com",
    staleAfterHours: 12,
  });

  assert.equal(status.status, "not_linked");
  assert.equal(status.recommendedNextAction, "connect_instagram");
});

test("deriveSetupStatus returns syncing for active runs", () => {
  const overview = baseOverview();
  overview.latestSyncRun = {
    id: "sync_1",
    instagramAccountId: "acct_1",
    status: "running",
    triggerType: "manual",
    workflowRunId: null,
    currentStep: "media",
    progressPercent: 50,
    statusMessage: "Running",
    startedAt: new Date().toISOString(),
    completedAt: null,
    lastHeartbeatAt: null,
    durationSeconds: null,
    mediaCount: null,
    warningCount: null,
    error: null,
    progress: null,
    summary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const status = deriveSetupStatus({
    overview,
    appUrl: "https://example.com",
    staleAfterHours: 12,
  });

  assert.equal(status.status, "syncing");
  assert.equal(status.recommendedNextAction, "wait_for_sync");
});

test("deriveSetupStatus returns stale when completed sync is old", () => {
  const overview = baseOverview();
  overview.latestSyncRun = {
    id: "sync_2",
    instagramAccountId: "acct_1",
    status: "completed",
    triggerType: "manual",
    workflowRunId: null,
    currentStep: "done",
    progressPercent: 100,
    statusMessage: "Done",
    startedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    lastHeartbeatAt: null,
    durationSeconds: null,
    mediaCount: null,
    warningCount: null,
    error: null,
    progress: null,
    summary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const status = deriveSetupStatus({
    overview,
    appUrl: "https://example.com",
    staleAfterHours: 12,
  });

  assert.equal(status.status, "stale");
  assert.equal(status.recommendedNextAction, "trigger_sync");
});

test("deriveSetupStatus returns ready when completed sync is fresh", () => {
  const overview = baseOverview();
  overview.latestSyncRun = {
    id: "sync_3",
    instagramAccountId: "acct_1",
    status: "completed",
    triggerType: "manual",
    workflowRunId: null,
    currentStep: "done",
    progressPercent: 100,
    statusMessage: "Done",
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    lastHeartbeatAt: null,
    durationSeconds: null,
    mediaCount: null,
    warningCount: null,
    error: null,
    progress: null,
    summary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const status = deriveSetupStatus({
    overview,
    appUrl: "https://example.com",
    staleAfterHours: 12,
  });

  assert.equal(status.status, "ready");
  assert.equal(status.recommendedNextAction, "analyze");
});
