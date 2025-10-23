# Quick Start: NPX Execution Support

**Feature**: 002-npx-support  
**Audience**: End users and maintainers  
**Purpose**: Get started with npx-based MCP Rector execution

---

## For End Users

### Prerequisites

- Node.js 18 or higher installed
- Internet connection (for first-time package download)
- npm 8+ (usually bundled with Node.js)

Verify installation:
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 8.0.0 or higher
```

---

### Quick Launch (Latest Version)

Run the MCP Rector server without installation:

```bash
npx mcp-rector
```

**What happens:**
1. npm downloads the latest `mcp-rector` package (first time only)
2. Package is cached to `~/.npm/_npx/`
3. Server starts and listens for MCP connections
4. You'll see output like:
   ```
   MCP Rector Server v1.0.0
   Listening on stdio for MCP connections...
   ```

**First-time execution**: Takes ~10-30 seconds depending on network speed  
**Subsequent executions**: Starts in ~2-5 seconds using cached package

---

### Version-Specific Execution

Run a specific version for reproducibility:

```bash
# Run exact version
npx mcp-rector@1.0.0

# Run latest 1.x version
npx mcp-rector@^1.0.0

# Run latest 1.2.x version
npx mcp-rector@~1.2.0
```

**Use cases:**
- Reproducible CI/CD pipelines
- Testing specific versions
- Avoiding breaking changes from major updates
- Comparing behavior across versions

---

### Using with MCP Inspector

Test the server interactively with MCP Inspector:

```bash
# Launch both inspector and server
npx @modelcontextprotocol/inspector npx mcp-rector
```

This opens the MCP Inspector in your browser, connected to the npx-launched server.

**Steps:**
1. Inspector UI opens at http://localhost:5173 (or similar)
2. Navigate to Tools tab
3. Test available tools:
   - `list-rector-rules`
   - `search-rector-rules`
   - `filter-rector-rules`
4. View request/response JSON in real-time

---

### Using in Claude Desktop

Add to your Claude Desktop MCP configuration:

**macOS/Linux**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: Edit `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-rector": {
      "command": "npx",
      "args": ["mcp-rector"]
    }
  }
}
```

**For specific version:**
```json
{
  "mcpServers": {
    "mcp-rector": {
      "command": "npx",
      "args": ["mcp-rector@1.0.0"]
    }
  }
}
```

Restart Claude Desktop to load the server.

---

### Using in CI/CD Pipelines

#### GitHub Actions

```yaml
name: Test MCP Integration
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run MCP Rector
        run: npx mcp-rector &
      - name: Run integration tests
        run: npm test
```

#### GitLab CI

```yaml
test:
  image: node:18
  script:
    - npx mcp-rector &
    - npm test
```

#### Docker

```dockerfile
FROM node:18-alpine

# Install and cache mcp-rector
RUN npx mcp-rector --version || true

# Your application setup
WORKDIR /app
COPY . .

# Run with npx
CMD ["npx", "mcp-rector"]
```

---

### Troubleshooting

#### Server doesn't start

**Problem**: `npx mcp-rector` hangs or errors

**Solutions:**
1. Check Node.js version: `node --version` (must be 18+)
2. Clear npx cache: `rm -rf ~/.npm/_npx/`
3. Try explicit version: `npx mcp-rector@latest`
4. Check npm registry access: `npm ping`

#### Package not found

**Problem**: `npm ERR! 404 Not Found - GET https://registry.npmjs.org/mcp-rector`

**Solutions:**
1. Verify package name spelling
2. Check if package is published: Visit https://www.npmjs.com/package/mcp-rector
3. Ensure npm registry is configured: `npm config get registry`

#### Permission denied

**Problem**: `EACCES: permission denied`

**Solutions:**
1. Don't use `sudo` with npx
2. Check npm prefix: `npm config get prefix`
3. Fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

#### Slow execution on Windows

**Problem**: npx takes 30+ seconds to start

**Solutions:**
1. Use PowerShell instead of cmd.exe
2. Add npm cache to antivirus exclusions
3. Use WSL2 for better performance

#### Version conflicts

**Problem**: `npx mcp-rector` uses old version

**Solutions:**
1. Clear cache: `npx clear-npx-cache` or `rm -rf ~/.npm/_npx/`
2. Force specific version: `npx mcp-rector@latest`
3. Check cached version: `npm ls -g mcp-rector`

---

### Offline Usage

npx caches downloaded packages, enabling offline execution after first download.

**Verify cache:**
```bash
ls ~/.npm/_npx/
```

**Limitations:**
- Cannot fetch new versions offline
- Must have run at least once online
- Cache persists until manually deleted

---

## For Maintainers

### Publishing New Versions

#### Prerequisites

- npm account with publish access to `mcp-rector`
- Git repository with clean working directory
- All tests passing: `npm test`
- Build succeeds: `npm run build`

#### Publishing Workflow

1. **Update version**
   ```bash
   # For bug fixes (1.0.0 → 1.0.1)
   npm version patch

   # For new features (1.0.0 → 1.1.0)
   npm version minor

   # For breaking changes (1.0.0 → 2.0.0)
   npm version major
   ```

   This automatically:
   - Updates `package.json` version
   - Creates a git commit
   - Creates a git tag

2. **Verify package contents**
   ```bash
   npm pack --dry-run
   ```

   Expected output:
   ```
   package: mcp-rector@1.0.0
   === Tarball Contents ===
   ... build/index.js
   ... build/models/...
   ... build/services/...
   ... build/tools/...
   ... package.json
   ... README.md
   === Tarball Details ===
   size: 450 KB
   unpacked size: 1.2 MB
   ```

   **Verify:**
   - Only `build/` directory is included
   - Size is <5MB
   - README.md and package.json are present

3. **Test npx execution locally**
   ```bash
   # Build fresh package
   npm run build

   # Pack to tarball
   npm pack

   # Test with local tarball
   npx mcp-rector-1.0.0.tgz
   ```

   **Expected:** Server starts successfully

4. **Publish to npm**
   ```bash
   npm publish
   ```

   **For beta versions:**
   ```bash
   npm version prerelease --preid=beta
   npm publish --tag beta
   ```

5. **Push to GitHub**
   ```bash
   git push --follow-tags
   ```

6. **Create GitHub Release**
   - Go to https://github.com/username/mcp-rector/releases
   - Click "Draft a new release"
   - Select the version tag
   - Add release notes describing changes

#### Post-Publish Verification

Test on all platforms:

```bash
# Linux/macOS
npx mcp-rector@latest

# Windows PowerShell
npx mcp-rector@latest

# With MCP Inspector
npx @modelcontextprotocol/inspector npx mcp-rector@latest
```

**Checklist:**
- [ ] Server starts on Linux
- [ ] Server starts on macOS
- [ ] Server starts on Windows
- [ ] MCP Inspector connects successfully
- [ ] All tools function correctly
- [ ] npm page shows correct metadata: https://www.npmjs.com/package/mcp-rector
- [ ] GitHub release is created

---

### Unpublishing/Deprecating

**Unpublish recent version** (within 72 hours):
```bash
npm unpublish mcp-rector@1.0.0
```

**Deprecate old version** (after 72 hours):
```bash
npm deprecate mcp-rector@1.0.0 "Use version 2.0.0 or higher"
```

**Warning:** Unpublishing affects users. Prefer deprecation with clear migration guidance.

---

### Package Metadata Updates

Update metadata without version bump:

```bash
# Edit package.json
nano package.json

# Publish with same version (only metadata changes)
npm publish
```

**Note:** npm allows metadata-only updates without version increment, but prefer versioning for clarity.

---

### Monitoring Usage

View download statistics:
```bash
npm view mcp-rector

# Or visit:
# https://www.npmjs.com/package/mcp-rector
```

**Metrics available:**
- Total downloads
- Downloads per version
- Weekly/monthly trends

---

## Security Considerations

### For End Users

- npx executes code directly from npm registry
- Always verify package name: `mcp-rector` (no typos)
- Use specific versions in production: `npx mcp-rector@1.0.0`
- Review package on npm before first use: https://www.npmjs.com/package/mcp-rector

### For Maintainers

- Enable 2FA on npm account
- Use `npm publish --otp=<code>` for 2FA
- Never commit credentials or secrets
- Audit dependencies regularly: `npm audit`
- Review all PRs carefully before merge
- Sign git commits and tags

---

## FAQs

### Does npx download the package every time?

No. npx caches packages in `~/.npm/_npx/`. After first download, execution is fast (~2-5 seconds).

### Can I use npx offline?

Yes, if the package is already cached. npx checks for updates online but falls back to cache if unreachable.

### How do I update to the latest version?

Run `npx mcp-rector@latest` or clear cache with `rm -rf ~/.npm/_npx/` and run `npx mcp-rector`.

### Why is my package size important?

Large packages slow down first-time execution. Keep under 5MB for good user experience.

### Can I run multiple versions simultaneously?

Yes. Use different terminal sessions with version-specific commands:
```bash
# Terminal 1
npx mcp-rector@1.0.0

# Terminal 2
npx mcp-rector@2.0.0
```

### Does npx work without npm?

No. npx is bundled with npm. Install npm to get npx.

---

## Additional Resources

- [npm documentation](https://docs.npmjs.com/)
- [npx documentation](https://docs.npmjs.com/cli/v10/commands/npx)
- [MCP specification](https://modelcontextprotocol.io/)
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)
- [Semantic Versioning](https://semver.org/)
