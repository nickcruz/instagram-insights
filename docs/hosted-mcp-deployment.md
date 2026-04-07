# Hosted MCP Deployment

This document covers two things:

1. How users install the hosted Instagram Insights MCP in Codex or Claude Code.
2. What still needs to happen to deploy the hosted API + MCP in production.

## What ships

The app now exposes:

- A hosted MCP endpoint at `/mcp`
- Read-only REST endpoints under `/api/v1/*`
- A signed-in dashboard page at `/profile/developer`
- A public docs page at `/developers`

The MCP and REST API are both authenticated with a personal API key created in the web app.

## User install flow

### 1. Sign in and prepare data

Each user must:

1. Sign in to the web app with Google
2. Link their Instagram account
3. Run at least one successful sync
4. Open `/profile/developer`
5. Create a personal API key

The API key is shown once and should be saved into a local environment variable.

Example:

```bash
export INSTAGRAM_INSIGHTS_API_KEY="paste-the-key-from-the-dashboard"
```

### 2. Install in Codex

As of April 7, 2026, the local Codex CLI supports adding a remote MCP with `--url` and `--bearer-token-env-var`.

```bash
codex mcp add instagram-insights \
  --url https://YOUR_APP_DOMAIN/mcp \
  --bearer-token-env-var INSTAGRAM_INSIGHTS_API_KEY
```

Verify:

```bash
codex mcp list
```

Recommended first prompt:

```text
Use get_account_overview and tell me whether my latest sync completed successfully.
```

### 3. Install in Claude Code

Claude Code supports remote HTTP MCP servers and bearer auth headers.

```bash
claude mcp add --transport http instagram-insights https://YOUR_APP_DOMAIN/mcp \
  --header "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY"
```

Verify:

```bash
claude mcp list
```

Recommended first prompt:

```text
Read schema://table/instagram_media_item and then list my most recent REELS posts.
```

### 4. Smoke test with curl

Before debugging the MCP client, verify the key and deployed API directly:

```bash
curl -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \
  https://YOUR_APP_DOMAIN/api/v1/account
```

If this fails with `401`, the problem is the key or auth header, not the MCP client.

## Production deploy checklist

### Required infrastructure

- A deployed Next.js app on Vercel
- A production Postgres database reachable from Vercel
- The latest Drizzle migration applied, including `developer_api_key`

### Required environment variables

At minimum, production needs:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` or `GOOGLE_CLIENT_ID`
- `AUTH_GOOGLE_SECRET` or `GOOGLE_CLIENT_SECRET`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_APP_URL`

Recommended:

- `APP_URL`
- `INSTAGRAM_REDIRECT_URI`
- `GRAPH_API_VERSION`

Notes:

- `APP_URL` should be the canonical public app origin used in docs and install snippets.
- `INSTAGRAM_APP_URL` should also match the public deployed origin unless Instagram OAuth is intentionally split out.
- `INSTAGRAM_REDIRECT_URI` should match the callback route exactly.

### Database rollout

Before the new UI or MCP is used in production:

1. Apply the migration in `packages/db/drizzle/0002_narrow_star_brand.sql`
2. Confirm the `developer_api_key` table exists
3. Confirm the app can still read existing Instagram tables after the migration

### App deployment steps

1. Push the current branch
2. Deploy the web app to Vercel
3. Confirm these routes return successfully on the deployed domain:
   - `/developers`
   - `/profile/developer`
   - `/api/v1/account` with bearer auth
   - `/mcp` with bearer auth
4. Sign in with a real user and create a key from `/profile/developer`
5. Run the `curl` smoke test
6. Install the hosted MCP in Codex
7. Install the hosted MCP in Claude Code

## What still needs to happen before calling this fully deployed

These are the remaining operational tasks outside the code already merged:

### 1. Set production env vars in Vercel

The code is ready, but the deployment will not be usable until the production project has the auth, Instagram, and database env vars set.

### 2. Apply the new database migration

The code includes the migration, but production still needs the migration run against the real database.

### 3. Verify the canonical app URL

The docs UI uses request headers first and falls back to `APP_URL` or `INSTAGRAM_APP_URL`. Set `APP_URL` so install snippets always show the correct public domain.

### 4. End-to-end validate with real clients

We have local compile, lint, build, and unit-test coverage, but production still needs:

- a real Codex install against the deployed domain
- a real Claude Code install against the deployed domain
- a real API key created by a signed-in user
- at least one completed sync for that user

### 5. Decide how migrations are run in production

We generated the SQL migration locally, but the team should still choose the actual production mechanism:

- manual `yarn db:push`
- CI migration step
- release script

### 6. Optional hardening follow-ups

These are not blockers for first deployment, but they would improve operations:

- Add API key expiration support in the dashboard UI
- Add rate limiting around `/api/v1/*` and `/mcp`
- Add request logging or analytics for MCP usage
- Add automated route tests for the deployed app
- Add a small “copy .mcp.json” example for shared Claude Code project config

## Quick acceptance checklist

The hosted MCP is ready when all of these are true:

- `/developers` renders on production
- `/profile/developer` lets a signed-in linked user create a key
- `curl` to `/api/v1/account` succeeds with that key
- `codex mcp add ... --url ... --bearer-token-env-var ...` works
- `claude mcp add --transport http ... --header ...` works
- MCP tools can read account overview, media, and sync runs
- MCP resources can read `schema://overview` and `schema://table/instagram_media_item`
