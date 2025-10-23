#!/usr/bin/env node
/**
 * MCP Rector Server
 * Provides tools for querying Rector PHP refactoring rules
 * Implements three MCP tools: list-rector-rules, filter-rector-rules, search-rector-rules
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listRulesHandler } from './tools/list-rules.js';
import { filterRulesHandler, filterRulesInputSchema } from './tools/filter-rules.js';
import { searchRulesHandler, searchRulesInputSchema } from './tools/search-rules.js';

const server = new McpServer({
  name: "mcp-rector",
  version: "1.0.0",
});

server.tool(
  'list-rector-rules',
  'List all available Rector rules with metadata including name, description, rule set, and status',
  listRulesHandler
);

server.tool(
  'filter-rector-rules',
  'Filter Rector rules by rule set category (e.g., php80, code-quality, type-declaration)',
  filterRulesInputSchema.shape,
  filterRulesHandler
);

server.tool(
  'search-rector-rules',
  'Search Rector rules by keyword query with optional rule set filter (case-insensitive partial matching)',
  searchRulesInputSchema.shape,
  searchRulesHandler
);

/**
 * Server initialization and startup
 * Connects MCP server to stdio transport for communication with MCP clients
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Rector server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});