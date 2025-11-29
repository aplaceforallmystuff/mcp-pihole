#!/usr/bin/env node
/**
 * MCP Server for Pi-hole v6
 *
 * Provides tools for managing Pi-hole DNS blocking, viewing statistics,
 * and controlling your Pi-hole instance via Claude Code.
 *
 * Environment variables:
 * - PIHOLE_URL: Pi-hole web interface URL (e.g., http://pihole.local:8080)
 * - PIHOLE_PASSWORD: Pi-hole app password for API authentication
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { PiholeClient } from "./pihole-client.js";
import { createDashboard, createBarChart, C } from "./ascii-viz.js";

// Get configuration from environment
const PIHOLE_URL = process.env.PIHOLE_URL;
const PIHOLE_PASSWORD = process.env.PIHOLE_PASSWORD;

if (!PIHOLE_URL || !PIHOLE_PASSWORD) {
  console.error("Error: PIHOLE_URL and PIHOLE_PASSWORD environment variables are required");
  process.exit(1);
}

// Initialize Pi-hole client
const pihole = new PiholeClient({
  url: PIHOLE_URL,
  password: PIHOLE_PASSWORD,
});

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "pihole_get_stats",
    description: "Get Pi-hole statistics including total queries, blocked queries, blocking percentage, active clients, and domains being blocked",
    inputSchema: {
      type: "object" as const,
      properties: {
        visualize: {
          type: "boolean",
          description: "Return ASCII art dashboard with bar charts instead of JSON",
        },
      },
      required: [],
    },
  },
  {
    name: "pihole_get_blocking_status",
    description: "Check if Pi-hole blocking is currently enabled or disabled",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "pihole_enable_blocking",
    description: "Enable Pi-hole DNS blocking",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "pihole_disable_blocking",
    description: "Disable Pi-hole DNS blocking, optionally for a specific duration",
    inputSchema: {
      type: "object" as const,
      properties: {
        duration: {
          type: "number",
          description: "Duration in seconds to disable blocking. If not specified, blocking is disabled indefinitely.",
        },
      },
      required: [],
    },
  },
  {
    name: "pihole_get_top_blocked",
    description: "Get the top blocked domains",
    inputSchema: {
      type: "object" as const,
      properties: {
        count: {
          type: "number",
          description: "Number of domains to return (default: 10)",
        },
        visualize: {
          type: "boolean",
          description: "Return ASCII art bar chart instead of JSON",
        },
      },
      required: [],
    },
  },
  {
    name: "pihole_get_top_permitted",
    description: "Get the top permitted (allowed) domains",
    inputSchema: {
      type: "object" as const,
      properties: {
        count: {
          type: "number",
          description: "Number of domains to return (default: 10)",
        },
        visualize: {
          type: "boolean",
          description: "Return ASCII art bar chart instead of JSON",
        },
      },
      required: [],
    },
  },
  {
    name: "pihole_get_top_clients",
    description: "Get the top clients by query count",
    inputSchema: {
      type: "object" as const,
      properties: {
        count: {
          type: "number",
          description: "Number of clients to return (default: 10)",
        },
        visualize: {
          type: "boolean",
          description: "Return ASCII art bar chart instead of JSON",
        },
      },
      required: [],
    },
  },
  {
    name: "pihole_get_query_log",
    description: "Get recent DNS queries from the query log",
    inputSchema: {
      type: "object" as const,
      properties: {
        count: {
          type: "number",
          description: "Number of queries to return (default: 100)",
        },
      },
      required: [],
    },
  },
  {
    name: "pihole_add_to_whitelist",
    description: "Add a domain to the Pi-hole whitelist (allow list)",
    inputSchema: {
      type: "object" as const,
      properties: {
        domain: {
          type: "string",
          description: "Domain to whitelist (e.g., example.com)",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "pihole_add_to_blacklist",
    description: "Add a domain to the Pi-hole blacklist (block list)",
    inputSchema: {
      type: "object" as const,
      properties: {
        domain: {
          type: "string",
          description: "Domain to blacklist (e.g., ads.example.com)",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "pihole_remove_from_whitelist",
    description: "Remove a domain from the Pi-hole whitelist",
    inputSchema: {
      type: "object" as const,
      properties: {
        domain: {
          type: "string",
          description: "Domain to remove from whitelist",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "pihole_remove_from_blacklist",
    description: "Remove a domain from the Pi-hole blacklist",
    inputSchema: {
      type: "object" as const,
      properties: {
        domain: {
          type: "string",
          description: "Domain to remove from blacklist",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "pihole_get_whitelist",
    description: "Get all domains on the Pi-hole whitelist",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "pihole_get_blacklist",
    description: "Get all domains on the Pi-hole blacklist",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "pihole_update_gravity",
    description: "Update Pi-hole's gravity (refresh blocklists). This may take a minute to complete.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "pihole_flush_cache",
    description: "Flush Pi-hole's DNS cache",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "mcp-pihole",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "pihole_get_stats": {
        const visualize = (args as { visualize?: boolean })?.visualize;
        const stats = await pihole.getStats();

        if (visualize) {
          // Fetch additional data for the dashboard
          const [topClients, topBlocked, topPermitted] = await Promise.all([
            pihole.getTopClients(6).catch(() => ({ clients: [] })),
            pihole.getTopBlockedDomains(6).catch(() => ({ domains: [] })),
            pihole.getTopPermittedDomains(6).catch(() => ({ domains: [] })),
          ]);

          const dashboard = createDashboard({
            ...stats,
            topClients: topClients.clients,
            topBlocked: topBlocked.domains,
            topPermitted: topPermitted.domains,
          });

          return {
            content: [{ type: "text", text: dashboard }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                total_queries: stats.queries.total,
                blocked_queries: stats.queries.blocked,
                percent_blocked: stats.queries.percent_blocked.toFixed(2) + "%",
                unique_domains: stats.queries.unique_domains,
                forwarded: stats.queries.forwarded,
                cached: stats.queries.cached,
                active_clients: stats.clients.active,
                total_clients: stats.clients.total,
                domains_blocked: stats.gravity.domains_being_blocked,
                gravity_last_update: new Date(stats.gravity.last_update * 1000).toISOString(),
                ...(stats.system && {
                  system: {
                    uptime_seconds: stats.system.uptime,
                    memory_percent_used: stats.system.memory.ram.percent_used.toFixed(1) + "%",
                    cpu_percent_used: stats.system.cpu.percent_used.toFixed(1) + "%",
                  },
                }),
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_get_blocking_status": {
        const status = await pihole.getBlockingStatus();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                blocking: status.blocking,
                timer: status.timer ? `${status.timer} seconds remaining` : null,
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_enable_blocking": {
        const status = await pihole.enableBlocking();
        return {
          content: [
            {
              type: "text",
              text: `Blocking ${status.blocking === "enabled" ? "enabled successfully" : "failed to enable"}`,
            },
          ],
        };
      }

      case "pihole_disable_blocking": {
        const duration = (args as { duration?: number })?.duration;
        const status = await pihole.disableBlocking(duration);
        return {
          content: [
            {
              type: "text",
              text: duration
                ? `Blocking disabled for ${duration} seconds`
                : "Blocking disabled indefinitely",
            },
          ],
        };
      }

      case "pihole_get_top_blocked": {
        const count = (args as { count?: number; visualize?: boolean })?.count || 10;
        const visualize = (args as { count?: number; visualize?: boolean })?.visualize;
        const data = await pihole.getTopBlockedDomains(count);

        if (visualize) {
          const chart = createBarChart(
            '🚫 TOP BLOCKED DOMAINS',
            data.domains.map(d => ({ label: d.domain, value: d.count })),
            data.total_queries,
            C.BRIGHT_RED
          );
          return {
            content: [{ type: "text", text: chart }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                total_queries: data.total_queries,
                domains: data.domains,
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_get_top_permitted": {
        const count = (args as { count?: number; visualize?: boolean })?.count || 10;
        const visualize = (args as { count?: number; visualize?: boolean })?.visualize;
        const data = await pihole.getTopPermittedDomains(count);

        if (visualize) {
          const chart = createBarChart(
            '🌐 TOP PERMITTED DOMAINS',
            data.domains.map(d => ({ label: d.domain, value: d.count })),
            data.total_queries,
            C.BRIGHT_GREEN
          );
          return {
            content: [{ type: "text", text: chart }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                total_queries: data.total_queries,
                domains: data.domains,
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_get_top_clients": {
        const count = (args as { count?: number; visualize?: boolean })?.count || 10;
        const visualize = (args as { count?: number; visualize?: boolean })?.visualize;
        const data = await pihole.getTopClients(count);

        if (visualize) {
          const chart = createBarChart(
            '🔝 TOP CLIENTS',
            data.clients.map(c => ({ label: c.name || c.ip, value: c.count })),
            data.total_queries,
            C.BRIGHT_BLUE
          );
          return {
            content: [{ type: "text", text: chart }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                total_queries: data.total_queries,
                clients: data.clients,
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_get_query_log": {
        const count = (args as { count?: number })?.count || 100;
        const data = await pihole.getQueryLog(count);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                query_count: data.queries.length,
                queries: data.queries.map((q) => ({
                  time: new Date(q.time * 1000).toISOString(),
                  domain: q.domain,
                  client: q.client,
                  type: q.type,
                  status: q.status,
                  response_time_ms: q.response_time,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_add_to_whitelist": {
        const domain = (args as { domain: string }).domain;
        await pihole.addToWhitelist(domain);
        return {
          content: [
            {
              type: "text",
              text: `Domain '${domain}' added to whitelist`,
            },
          ],
        };
      }

      case "pihole_add_to_blacklist": {
        const domain = (args as { domain: string }).domain;
        await pihole.addToBlacklist(domain);
        return {
          content: [
            {
              type: "text",
              text: `Domain '${domain}' added to blacklist`,
            },
          ],
        };
      }

      case "pihole_remove_from_whitelist": {
        const domain = (args as { domain: string }).domain;
        await pihole.removeFromWhitelist(domain);
        return {
          content: [
            {
              type: "text",
              text: `Domain '${domain}' removed from whitelist`,
            },
          ],
        };
      }

      case "pihole_remove_from_blacklist": {
        const domain = (args as { domain: string }).domain;
        await pihole.removeFromBlacklist(domain);
        return {
          content: [
            {
              type: "text",
              text: `Domain '${domain}' removed from blacklist`,
            },
          ],
        };
      }

      case "pihole_get_whitelist": {
        const data = await pihole.getWhitelist();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                count: data.domains.length,
                domains: data.domains,
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_get_blacklist": {
        const data = await pihole.getBlacklist();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                count: data.domains.length,
                domains: data.domains,
              }, null, 2),
            },
          ],
        };
      }

      case "pihole_update_gravity": {
        const result = await pihole.updateGravity();
        return {
          content: [
            {
              type: "text",
              text: result.success
                ? "Gravity update started successfully"
                : "Gravity update failed",
            },
          ],
        };
      }

      case "pihole_flush_cache": {
        const result = await pihole.flushCache();
        return {
          content: [
            {
              type: "text",
              text: result.success
                ? "DNS cache flushed successfully"
                : "Failed to flush DNS cache",
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pi-hole MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
