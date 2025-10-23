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

### Automated Publishing (Recommended)

The repository uses GitHub Actions for automated publishing to **both GitHub Packages (primary) and npm** on merge to `main`:

1. **Setup** (One-time):
   - Create npm automation token at https://www.npmjs.com/settings/tokens
   - Add as `NPM_TOKEN` secret in GitHub repository settings
   - GitHub Packages uses built-in `GITHUB_TOKEN` (no extra setup)
   - See `.github/PUBLISH.md` for detailed setup instructions

2. **Publish New Version**:
   ```bash
   # Bump version locally
   npm version patch  # Bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # New features (1.0.0 -> 1.1.0)
   npm version major  # Breaking changes (1.0.0 -> 2.0.0)
   
   # Push to trigger workflow
   git push origin main
   ```

3. **What Happens**:
   - GitHub Actions runs lint, typecheck, build, and tests
   - If version changed, publishes to **GitHub Packages** as `@vsilvestre/mcp-rector` (primary)
   - If version changed, publishes to **npm** as `mcp-rector` (fallback)
   - Creates git tag matching new version

### Package Locations

- **GitHub Packages** (Primary): https://github.com/vsilvestre/mcp-rector/packages
- **npm** (Fallback): https://www.npmjs.com/package/mcp-rector

### Installing from Different Registries

**From GitHub Packages (Recommended):**
```bash
npx @vsilvestre/mcp-rector
npm install -g @vsilvestre/mcp-rector
```

**From npm (public, no auth required):**
```bash
npx mcp-rector
npm install -g mcp-rector
```

### Manual Publishing (Fallback)

If GitHub Actions is unavailable:

1. Ensure you're authenticated with npm:
```bash
npm whoami  # Should return your npm username
# If not authenticated:
npm login
```

2. Run pre-publish checks:
```bash
npm run build
npm test
npm pack --dry-run  # Verify package size <5MB
```

3. Publish to npm:
```bash
npm publish --access public
```

4. Publish to GitHub Packages:
```bash
# Temporarily modify package.json name to @vsilvestre/mcp-rector
npm publish --registry=https://npm.pkg.github.com
# Restore package.json
```

5. Push git tags to remote:
```bash
git tag v1.0.1
git push --tags
```

### Post-Publish Verification

Verify packages are accessible:

```bash
# npm registry
npm view mcp-rector
npx mcp-rector

# GitHub Packages
npm view @vsilvestre/mcp-rector --registry=https://npm.pkg.github.com

# Test specific version
npx mcp-rector@1.0.0
npx @vsilvestre/mcp-rector@1.0.0
```

### Troubleshooting Publishing

**GitHub Actions Issues:**
- **Workflow doesn't publish**: Ensure package.json version was incremented
- **NPM_TOKEN error**: Verify secret is set correctly in repository settings
- **GitHub Packages fails**: Check workflow has `packages: write` permission
- **Permission denied**: Check workflow permissions in repository settings → Actions → General

**Manual Publishing Issues:**
- **403 Forbidden (npm)**: Check npm authentication with `npm whoami`
- **403 Forbidden (GitHub)**: Ensure `GITHUB_TOKEN` has packages write permission
- **Package name taken**: Choose alternative name or use scoped package
- **2FA required**: Ensure 2FA token is provided during `npm publish`
- **Git tag conflicts**: Use `git tag -d v1.0.0` to delete local tag, `git push --delete origin v1.0.0` for remote

No Cursor or Copilot rules present.

## Active Technologies
- TypeScript 5.9.3 with Node.js 18+ + @modelcontextprotocol/sdk, Zod (already in use) (002-npx-support)
- N/A (no data persistence required for this feature) (002-npx-support)

## Recent Changes
- 002-npx-support: Added TypeScript 5.9.3 with Node.js 18+ + @modelcontextprotocol/sdk, Zod (already in use)
