---
name: Instagram Insights
description: Use the bundled Instagram Insights CLI to authenticate with Google, link Instagram, sync account data, and inspect account, snapshot, media, and sync-run data from the hosted REST API.
---

Use this skill whenever the user wants to work with Instagram Insights data.

Core rules:

- Use the bundled CLI, not raw HTTP requests and not MCP tools.
- Resolve paths relative to this skill folder.
- The CLI stores OAuth tokens in `./.auth/state.json` inside this installed skill folder.
- Data-returning commands already default to JSON output.

CLI entrypoint:

```bash
node ./bin/instagram-insights.mjs
```

Recommended workflow:

1. Run `node ./bin/instagram-insights.mjs auth status`.
2. If not authenticated, run `node ./bin/instagram-insights.mjs auth login`.
3. Run `node ./bin/instagram-insights.mjs setup status`.
4. If setup reports `not_linked`, run `node ./bin/instagram-insights.mjs instagram link --open`.
5. If setup reports `not_synced` or `stale`, run `node ./bin/instagram-insights.mjs sync run --wait`.
6. Use `account overview`, `snapshot latest`, `media list`, `media get`, `sync list`, and `sync get` for analysis or debugging.

Supported commands:

- `node ./bin/instagram-insights.mjs auth login`
- `node ./bin/instagram-insights.mjs auth status`
- `node ./bin/instagram-insights.mjs auth logout`
- `node ./bin/instagram-insights.mjs setup status --stale-after-hours 12`
- `node ./bin/instagram-insights.mjs account overview`
- `node ./bin/instagram-insights.mjs snapshot latest`
- `node ./bin/instagram-insights.mjs media list --limit 10`
- `node ./bin/instagram-insights.mjs media get <mediaId>`
- `node ./bin/instagram-insights.mjs sync list --limit 10`
- `node ./bin/instagram-insights.mjs sync get <syncRunId>`
- `node ./bin/instagram-insights.mjs sync run --wait`
- `node ./bin/instagram-insights.mjs instagram link --open`

Notes:

- `auth login` opens the hosted OAuth flow and completes Google sign-in through the web app before returning to the CLI loopback callback.
- `setup status --open-link` can open the Instagram handoff automatically when the account is not linked.
- `--app-url` can override the default production URL for local or staging testing.
