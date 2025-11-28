# mcp-pihole

MCP (Model Context Protocol) server for Pi-hole v6 API. Control your Pi-hole DNS blocking, view statistics, manage whitelists/blacklists, and more directly from Claude Code.

## Features

- **Statistics**: View total queries, blocked queries, top domains, top clients
- **Blocking Control**: Enable/disable blocking, set temporary disable timers
- **Domain Management**: Add/remove domains from whitelist and blacklist
- **Query Log**: View recent DNS queries with detailed information
- **Maintenance**: Update gravity (blocklists), flush DNS cache

## Installation

### Via npm

```bash
npm install -g @jcaai/mcp-pihole
```

### From source

```bash
git clone https://github.com/aplaceforallmystuff/mcp-pihole.git
cd mcp-pihole
npm install
npm run build
```

## Configuration

The server requires two environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PIHOLE_URL` | Pi-hole web interface URL | `http://pihole.local:8080` |
| `PIHOLE_PASSWORD` | Pi-hole app password | Your app password from Pi-hole settings |

### Getting Your Pi-hole App Password

1. Open your Pi-hole web interface
2. Go to Settings > API
3. Generate a new app password
4. Copy the password (it's only shown once)

## Usage with Claude Code

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "pihole": {
      "command": "npx",
      "args": ["-y", "@jcaai/mcp-pihole"],
      "env": {
        "PIHOLE_URL": "http://your-pihole-address:8080",
        "PIHOLE_PASSWORD": "your-app-password"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "pihole": {
      "command": "mcp-pihole",
      "env": {
        "PIHOLE_URL": "http://your-pihole-address:8080",
        "PIHOLE_PASSWORD": "your-app-password"
      }
    }
  }
}
```

## Available Tools

### Statistics

| Tool | Description |
|------|-------------|
| `pihole_get_stats` | Get comprehensive Pi-hole statistics |
| `pihole_get_top_blocked` | Get top blocked domains |
| `pihole_get_top_permitted` | Get top permitted domains |
| `pihole_get_top_clients` | Get top clients by query count |
| `pihole_get_query_log` | Get recent DNS queries |

### Blocking Control

| Tool | Description |
|------|-------------|
| `pihole_get_blocking_status` | Check if blocking is enabled |
| `pihole_enable_blocking` | Enable DNS blocking |
| `pihole_disable_blocking` | Disable blocking (optionally with timer) |

### Domain Management

| Tool | Description |
|------|-------------|
| `pihole_get_whitelist` | List all whitelisted domains |
| `pihole_get_blacklist` | List all blacklisted domains |
| `pihole_add_to_whitelist` | Add domain to whitelist |
| `pihole_add_to_blacklist` | Add domain to blacklist |
| `pihole_remove_from_whitelist` | Remove domain from whitelist |
| `pihole_remove_from_blacklist` | Remove domain from blacklist |

### Maintenance

| Tool | Description |
|------|-------------|
| `pihole_update_gravity` | Update blocklists (gravity) |
| `pihole_flush_cache` | Flush DNS cache |

## Example Usage

Once configured, you can use natural language with Claude:

- "Show me Pi-hole stats"
- "What are the top blocked domains?"
- "Disable Pi-hole blocking for 5 minutes"
- "Add example.com to the whitelist"
- "Show recent DNS queries"

## Requirements

- Node.js 18+
- Pi-hole v6 with API enabled
- Network access to Pi-hole from your machine

## License

MIT

## Author

Jim Christian
