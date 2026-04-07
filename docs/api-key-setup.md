# API Key Setup

This document explains how to create and use a personal API key for the hosted REST API and MCP.

## Prerequisites

Before creating a key, the user should:

1. Sign in to the app with Google
2. Link an Instagram account
3. Complete at least one successful sync

## Create A Key

Open the developer page in the web app:

```text
https://YOUR_APP_DOMAIN/profile/developer
```

Create a new personal API key and copy the value immediately. The full secret is only shown once.

Recommended shell setup:

```bash
export INSTAGRAM_INSIGHTS_API_KEY="paste-the-key-from-the-dashboard"
```

## Use The Key With REST

Example:

```bash
curl -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \
  https://YOUR_APP_DOMAIN/api/v1/account
```

Queue a sync:

```bash
curl -X POST \
  -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force":false,"staleAfterHours":12}' \
  https://YOUR_APP_DOMAIN/api/v1/sync-runs
```

## Use The Key With MCP

Codex example:

```bash
codex mcp add instagram-insights \
  --url https://YOUR_APP_DOMAIN/mcp \
  --bearer-token-env-var INSTAGRAM_INSIGHTS_API_KEY
```

Claude Code example:

```bash
claude mcp add --transport http instagram-insights https://YOUR_APP_DOMAIN/mcp \
  --header "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY"
```

## Common Errors

### `401 Missing bearer token`

The client is not sending `Authorization: Bearer ...`.

### `401 Invalid API key`

The key is malformed, revoked, expired, or copied incorrectly.

### `400 No linked Instagram account found`

The key owner has not connected Instagram yet.

### `404 Sync run not found`

The sync run belongs to another user or the ID is incorrect.
