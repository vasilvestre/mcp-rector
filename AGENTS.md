# AGENTS.md

## Build, Lint, and Test Commands
- **TypeScript**: `npm test` (all), `npm test -- testName` (single)
- **Install**: `npm install`
- **Build**: `npm run build` (TypeScript to build/)
- **Lint**: `npm run lint`
- **Type Check**: `npm run typecheck`

## Code Style Guidelines
- **Imports**: Group stdlib, third-party, MCP SDK, and local imports separately
- **Formatting**: 4-space indent, 2-space indent
- **Types**: Use strict type hints interfaces everywhere
- **Naming**: camelCase, kebab-case for tool names
- **Error Handling**: Always catch and return structured MCP error responses
- **Validation**: Validate all user inputs before processing Rector rules
- **Testing**: Write independent tests for each MCP tool handler; use mock Rector rule data
- **Documentation**: Document each tool's purpose, inputs, and example Rector rules
- **Reference**: Use official Rector docs and rule sets for context

## Technology Stack
- **Testing**: Node.js built-in `node:test` runner (zero dependencies)
- **HTTP**: Native `fetch` API (Node 18+, no axios/node-fetch)
- **Validation**: Zod schemas for MCP tool inputs/outputs
- **MCP SDK**: `@modelcontextprotocol/sdk` for server.registerTool() pattern
- **Caching**: TypeScript `Map` singleton for session-scoped data

## MCP Tool Registration Pattern
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";

const InputSchema = z.object({
  query: z.string().min(1),
  ruleSet: z.string().optional()
});

server.registerTool(
  "search-rector-rules",
  "Searches Rector rules by keyword",
  InputSchema,
  async (args) => {
    const { query, ruleSet } = args;
    return {
      rules: [...],
      matchedCount: 0,
      query
    };
  }
);
```

## Data Source
- **Rector Rules**: `https://raw.githubusercontent.com/rectorphp/rector/main/docs/rector_rules_overview.md`
- **Format**: Markdown with `## Categories` → `### RuleName` structure
- **Parsing**: Extract name, description, classPath via regex
- **Validation**: Skip rules with missing required fields

## Documentation Resources
- **MCP Spec**: Use Context7 to fetch https://modelcontextprotocol.io/docs/
- Reference official docs via Context7 for MCP features

## Publishing Workflow

### Pre-Publish Checklist
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Package size <5MB: `npm pack --dry-run`
- [ ] README is up-to-date with npx instructions
- [ ] Version number is correct in package.json

### Version Management

Bump version using semantic versioning:

```bash
npm version patch  # Bug fixes (1.0.0 -> 1.0.1)
npm version minor  # New features (1.0.0 -> 1.1.0)
npm version major  # Breaking changes (1.0.0 -> 2.0.0)
```

This automatically:
- Updates package.json version
- Creates a git tag (v1.0.1, v1.1.0, etc.)
- Commits the version change

### Publishing to npm

1. Ensure you're authenticated with npm:
```bash
npm whoami  # Should return your npm username
# If not authenticated:
npm login
```

2. Publish the package:
```bash
npm publish --access public
```

3. Push git tags to remote:
```bash
git push --follow-tags
```

### Post-Publish Verification

Verify the package is accessible:

```bash
# View package info on npm
npm view mcp-rector

# Test npx execution with published package
npx mcp-rector

# Test specific version
npx mcp-rector@1.0.0
```

### Troubleshooting Publishing

- **403 Forbidden**: Check npm authentication with `npm whoami`
- **Package name taken**: Choose alternative name or use scoped package `@username/mcp-rector`
- **2FA required**: Ensure 2FA token is provided during `npm publish`
- **Git tag conflicts**: Use `git tag -d v1.0.0` to delete local tag, `git push --delete origin v1.0.0` for remote

No Cursor or Copilot rules present.

## Active Technologies
- TypeScript 5.9.3 with Node.js 18+ + @modelcontextprotocol/sdk, Zod (already in use) (002-npx-support)
- N/A (no data persistence required for this feature) (002-npx-support)

## Recent Changes
- 002-npx-support: Added TypeScript 5.9.3 with Node.js 18+ + @modelcontextprotocol/sdk, Zod (already in use)
