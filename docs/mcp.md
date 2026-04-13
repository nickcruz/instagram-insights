# MCP Deprecation

The hosted Instasights MCP has been deprecated.

## Deprecated endpoints

- `/mcp`
- `/.well-known/oauth-protected-resource/mcp`

Both now return `410 Gone`.

## Supported replacement

Use the Instasights skill and bundled CLI instead:

```bash
./skills/instasights/instasights auth login
./skills/instasights/instasights setup status
./skills/instasights/instasights sync run --wait
```

The CLI talks directly to `/api/v1/*` and authenticates through `/oauth/*`.

On a fresh install, start from `./skills/instasights/instasights` so the skill can verify Node.js 20+ and run the bundled MJS CLI from `./bin/`.
