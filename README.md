# Creator Insights

Creator Insights is a Claude-first Instagram analytics workflow built around a hosted MCP server, a thin Next.js backend, and durable sync/transcription services.

## What This Repo Contains

- A hosted web app in `apps/web` that exposes `/mcp`, OAuth routes, `/api/v1/*`, Instagram auth handoffs, and the minimal install/troubleshooting UI.
- Shared packages in `packages/*` for MCP behavior, contracts, database access, and infrastructure definitions.
- A transcriber service in `services/transcriber` used by the sync pipeline.
- A Claude plugin bundle in `plugins/instagram-insights` plus a repository marketplace in `.claude-plugin/marketplace.json`.

## Claude Install

The primary user experience is the Claude plugin marketplace flow:

```text
/plugin marketplace add https://github.com/nickcruz/creator-insights.git
/plugin install instagram-insights@creator-insights-plugins
```

After install, run:

```text
/instagram-insights:setup
```

Claude authenticates the hosted MCP server through OAuth, stores its own credentials locally, and then uses the bundled plugin skills to connect Instagram, sync, and analyze.

## Hosted Architecture

- `apps/web` is the orchestration layer for:
  - `/mcp`
  - `/.well-known/oauth-*`
  - `/oauth/*`
  - `/api/login`
  - `/api/callback`
  - `/api/v1/*`
- Sync runs are queued through the backend and executed via the workflow-backed sync pipeline.
- The Whisper-compatible transcription service lives under `services/transcriber`.
- `/developers` is the supported human-facing page for install help and troubleshooting.

## Local Development

Install dependencies:

```bash
yarn install --frozen-lockfile
```

Set up environment variables from `.env.example` and `apps/web/.env.example`.

Useful commands:

```bash
yarn typecheck
yarn test:web
python3 -m pytest services/transcriber/tests
yarn build
```

For local Claude plugin development:

```bash
export INSTAGRAM_INSIGHTS_APP_URL="https://YOUR_APP_DOMAIN"
claude --plugin-dir ./plugins/instagram-insights
```

## Compatibility Notes

- Legacy developer API keys are still supported for fallback REST and manual MCP use.
- The repo-root legacy `skills/` content is intentionally not part of the public product surface.
- GitHub usernames and install URLs remain `nickcruz`; human-readable author display is `Nick Reyes`.

## License

MIT. See [LICENSE](./LICENSE).
