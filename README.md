# MCP Pi-hole Server

[![npm version](https://img.shields.io/npm/v/mcp-pihole-server.svg)](https://www.npmjs.com/package/mcp-pihole-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

An MCP (Model Context Protocol) server that connects AI assistants like Claude to your [Pi-hole](https://pi-hole.net) network-wide ad blocker. Manage DNS blocking, view statistics, control whitelists/blacklists, and more through natural language.

## Why Use This?

If you're running Pi-hole on your network, this MCP server lets you:

- **Monitor DNS traffic** - View query statistics, top blocked domains, and client activity
- **Control blocking** - Enable/disable Pi-hole blocking instantly or with a timer
- **Manage lists** - Add or remove domains from whitelist and blacklist without opening the web UI
- **View query logs** - See recent DNS queries with detailed information
- **Maintain your Pi-hole** - Update gravity (blocklists) and flush DNS cache

## Features

| Category | Tools |
|----------|-------|
| **Statistics** | Query totals, blocking percentage, top domains, top clients |
| **Blocking Control** | Enable, disable (with optional timer), check status |
| **Domain Lists** | Whitelist/blacklist CRUD operations |
| **Query Log** | Recent DNS queries with client, status, response time |
| **Maintenance** | Update gravity, flush cache |

## Prerequisites

- Node.js 18+
- [Pi-hole](https://pi-hole.net) v6 with API enabled
- Pi-hole app password (generated in Pi-hole settings)
- Network access to Pi-hole from your machine

## Installation

### Option 1: Install from npm (recommended)

```bash
npx mcp-pihole-server
```

Or install globally:

```bash
npm install -g mcp-pihole-server
```

### Option 2: Clone and Build

```bash
git clone https://github.com/aplaceforallmystuff/mcp-pihole.git
cd mcp-pihole
npm install
npm run build
```

## Configuration

### 1. Get Your Pi-hole App Password

1. Open your Pi-hole web interface
2. Go to Settings > API
3. Generate a new app password
4. Copy the password (it's only shown once)

### 2. Configure Your MCP Client

#### For Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pihole": {
      "command": "npx",
      "args": ["-y", "mcp-pihole-server"],
      "env": {
        "PIHOLE_URL": "http://your-pihole-address:8080",
        "PIHOLE_PASSWORD": "your-app-password"
      }
    }
  }
}
```

#### For Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "pihole": {
      "command": "npx",
      "args": ["-y", "mcp-pihole-server"],
      "env": {
        "PIHOLE_URL": "http://your-pihole-address:8080",
        "PIHOLE_PASSWORD": "your-app-password"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PIHOLE_URL` | Pi-hole web interface URL | `http://pihole.local:8080` |
| `PIHOLE_PASSWORD` | Pi-hole app password | Your app password from settings |

## Usage Examples

Once configured, you can interact with Pi-hole through natural language:

### View Statistics
> "Show me Pi-hole stats"

> "What are the top blocked domains?"

> "Which clients are making the most queries?"

### Control Blocking
> "Is Pi-hole blocking enabled?"

> "Disable Pi-hole for 5 minutes"

> "Re-enable Pi-hole blocking"

### Manage Domain Lists
> "Add example.com to the whitelist"

> "Block ads.trackersite.com"

> "Show me all whitelisted domains"

### View Query Log
> "Show me the last 50 DNS queries"

> "What domains has my phone been querying?"

## Available Tools

### Statistics
- `pihole_get_stats` - Get comprehensive Pi-hole statistics
- `pihole_get_top_blocked` - Get top blocked domains
- `pihole_get_top_permitted` - Get top permitted domains
- `pihole_get_top_clients` - Get top clients by query count
- `pihole_get_query_log` - Get recent DNS queries

### Blocking Control
- `pihole_get_blocking_status` - Check if blocking is enabled
- `pihole_enable_blocking` - Enable DNS blocking
- `pihole_disable_blocking` - Disable blocking (optionally with timer)

### Domain Management
- `pihole_get_whitelist` - List all whitelisted domains
- `pihole_get_blacklist` - List all blacklisted domains
- `pihole_add_to_whitelist` - Add domain to whitelist
- `pihole_add_to_blacklist` - Add domain to blacklist
- `pihole_remove_from_whitelist` - Remove domain from whitelist
- `pihole_remove_from_blacklist` - Remove domain from blacklist

### Maintenance
- `pihole_update_gravity` - Update blocklists (gravity)
- `pihole_flush_cache` - Flush DNS cache

## Development

```bash
# Run in development mode (auto-reloads)
npm run watch

# Build for production
npm run build

# Run the built version
node dist/index.js
```

## Troubleshooting

### "PIHOLE_URL and PIHOLE_PASSWORD environment variables are required"
Ensure both environment variables are set in your MCP config.

### "Authentication failed"
Your app password is invalid or expired. Generate a new one from Pi-hole Settings > API.

### "API request failed: 401"
Session expired. The server will automatically re-authenticate, but if issues persist, check your password.

### Connection refused
Ensure Pi-hole is running and the URL is correct. Check that you can access the Pi-hole web interface from your machine.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Pi-hole](https://pi-hole.net)
- [Pi-hole Documentation](https://docs.pi-hole.net)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
