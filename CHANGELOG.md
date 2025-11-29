# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.1] - 2025-11-28

### Changed
- Package name changed to `mcp-pihole-server` (unscoped) for npm registry
- Added `mcpName` field for MCP registry compatibility

### Added
- Standardized README structure with badges and comprehensive documentation
- Claude Desktop and Claude Code configuration examples
- LICENSE file (MIT)
- CONTRIBUTING.md

## [1.0.0] - 2025-11-28

### Added
- Initial release with MCP tools for Pi-hole v6 API
- Pi-hole v6 API client with session-based authentication
- **Statistics tools:**
  - `pihole_get_stats` - Get Pi-hole statistics (queries, blocking %, etc.)
  - `pihole_get_top_domains` - Get top queried domains
  - `pihole_get_top_blocked` - Get top blocked domains
  - `pihole_get_top_clients` - Get top clients by query count
- **Blocking control:**
  - `pihole_enable_blocking` - Enable ad blocking
  - `pihole_disable_blocking` - Disable blocking (with optional timer)
  - `pihole_get_blocking_status` - Check current blocking status
- **Domain management:**
  - `pihole_get_whitelist` - List whitelisted domains
  - `pihole_add_whitelist` - Add domain to whitelist
  - `pihole_remove_whitelist` - Remove domain from whitelist
  - `pihole_get_blacklist` - List blacklisted domains
  - `pihole_add_blacklist` - Add domain to blacklist
  - `pihole_remove_blacklist` - Remove domain from blacklist
- **Maintenance tools:**
  - `pihole_update_gravity` - Update gravity (block lists)
  - `pihole_flush_cache` - Flush DNS cache
- **Query tools:**
  - `pihole_get_queries` - Get recent DNS query log
