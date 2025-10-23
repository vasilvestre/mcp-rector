# mcp-rector

MCP server providing tools to query and filter Rector PHP refactoring rules.

## Installation

### Quick Start (No Installation Required)

Run the MCP Rector server directly without installation using npx:

```bash
npx mcp-rector
```

To use a specific version:

```bash
npx mcp-rector@1.0.0
```

### Local Installation

Alternatively, install globally:

```bash
npm install -g mcp-rector
mcp-rector
```

### Development Setup

For local development:

```bash
npm install
npm run build
```

## Testing Locally with MCP Inspector

The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) is a developer tool for testing MCP servers locally before integrating them with clients.

### Install Inspector

```bash
npx @modelcontextprotocol/inspector
```

### Run the Server with Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

This will:
1. Start the MCP Inspector UI in your browser
2. Connect to your mcp-rector server
3. Allow you to test all available tools interactively

### Using the Inspector

The Inspector provides:
- **Tools tab**: View and test all registered tools (list-rector-rules, search-rector-rules, etc.)
- **Request/Response panels**: See the full MCP protocol messages
- **Interactive testing**: Call tools with custom parameters and see results immediately

Example test flow:
1. Open the Inspector
2. Navigate to the Tools tab
3. Select `list-rector-rules`
4. Add optional parameters (e.g., `{"ruleSet": "naming"}`)
5. Click "Run" to see the results

## Available Tools

- `list-rector-rules`: List all available Rector rules with optional filtering by rule set
- Additional tools documented in specs/001-list-rector-rules/

## Development

```bash
npm run build      # Build TypeScript to build/
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

## Troubleshooting

### npx command not found

Ensure Node.js 18+ and npm are installed:

```bash
node --version  # Should be >= 18.0.0
npm --version
```

### Permission denied errors (Unix/Linux)

The package should handle permissions automatically. If issues persist, try:

```bash
npx --yes mcp-rector
```

### Network/registry errors

Check npm registry connectivity:

```bash
npm ping
```

### Clear npx cache

If experiencing issues with cached versions, clear the npx cache:

```bash
rm -rf ~/.npm/_npx
```

### Windows execution issues

On Windows, you may need to adjust PowerShell execution policy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
