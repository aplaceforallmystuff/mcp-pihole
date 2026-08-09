# AGENTS.md - mcp-pihole

MCP server for Pi-hole v6 API - DNS blocking management and statistics.

## Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js (ES modules)
- **Protocol:** Model Context Protocol (MCP)

## Architecture
```
src/
├── index.ts          # Server entry, tool registration
└── tools/            # Tool implementations
    ├── stats.ts      # Statistics and dashboard
    ├── blocking.ts   # Enable/disable blocking
    ├── lists.ts      # Whitelist/blacklist management
    └── queries.ts    # Query log access
```

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| PIHOLE_URL | Yes | Pi-hole admin URL (e.g., http://pihole.local:8080) |
| PIHOLE_PASSWORD | Yes | Pi-hole admin password |

## Development
```bash
npm run build    # Compile TypeScript
npm run watch    # Watch mode
```

## Constraints
```yaml
rules:
  - id: v6-api
    description: Uses Pi-hole v6 API (not legacy PHP API)
  - id: session-auth
    description: Authenticates via session, not API key
  - id: destructive-ops
    description: Blocking disable should warn about security implications
```

## Pre-Publish

Run `/publish-mcp` before any `npm publish` — mandatory pipeline that handles tests, secret scan, sanitize, docs check, version bump, tag, push, and publish in strict order. Do not run `npm publish` directly.
