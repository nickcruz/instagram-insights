# MCP Deprecation

The hosted Instagram Insights MCP has been deprecated.

## Deprecated endpoints

- `/mcp`
- `/.well-known/oauth-protected-resource/mcp`

Both now return `410 Gone`.

## Supported replacement

Use the Instagram Insights skill and bundled CLI instead:

```bash
node ./skills/instagram-insights/bin/instagram-insights.mjs auth login
node ./skills/instagram-insights/bin/instagram-insights.mjs setup status
node ./skills/instagram-insights/bin/instagram-insights.mjs sync run --wait
```

The CLI talks directly to `/api/v1/*` and authenticates through `/oauth/*`.
