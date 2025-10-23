# Research: NPX Execution Support

**Feature**: 002-npx-support  
**Date**: 2025-10-23  
**Purpose**: Research npm publishing configuration and npx compatibility requirements

## Research Questions & Findings

### 1. npm Binary Configuration

**Question**: What is the correct `bin` field format in package.json for npx compatibility?

**Decision**: Use object format with command name as key, path to executable as value.

```json
{
  "bin": {
    "mcp-rector": "./build/index.js"
  }
}
```

**Rationale**: 
- Object format is recommended for clarity and future extensibility
- Allows mapping multiple commands if needed in future
- npx automatically uses package name if bin has single entry
- String format (`"bin": "./build/index.js"`) is alternative but less explicit

**Alternatives Considered**:
- String format: Less clear when multiple binaries exist
- Root-level executable: Requires additional symlinking logic

**Implementation Notes**:
- Command name should match package name for intuitive usage
- Path must be relative to package root
- File must exist in published package (include in `files` field)

---

### 2. Shebang Requirements

**Question**: What shebang line is required for cross-platform Node.js execution?

**Decision**: Use `#!/usr/bin/env node` shebang at the top of build/index.js

**Rationale**:
- `env` finds Node.js in PATH, making it portable across systems
- Direct path like `#!/usr/bin/node` fails when Node.js is installed elsewhere
- Works on Linux, macOS, and Windows (via Git Bash/WSL)
- Windows native npm handles shebangs transparently via wrapper scripts

**Alternatives Considered**:
- `#!/usr/bin/node`: Too brittle, assumes fixed installation path
- No shebang: Requires explicit `node` command, breaks npx

**Implementation Notes**:
- Add shebang to index.ts source: `#!/usr/bin/env node`
- TypeScript compiler preserves it in build output
- Alternatively, add via build script if TypeScript strips it
- Must be first line of file (no blank lines before)

---

### 3. Executable Permissions

**Question**: How to ensure executable permissions are preserved during npm publish?

**Decision**: Set permissions via `chmod +x build/index.js` in build script

**Rationale**:
- npm preserves file permissions when publishing
- Unix permissions (755) translate to Windows correctly via npm wrappers
- Build script is reliable checkpoint to ensure permissions
- Git may not preserve executable bit depending on config

**Alternatives Considered**:
- Git attributes: Not reliable across all contributors' configurations
- Post-install script: Adds complexity and slows installation
- Manual chmod: Error-prone, not repeatable

**Implementation Notes**:
- Current package.json has: `"build": "tsc && chmod 755 build/index.js"`
- This already sets correct permissions ✅
- Verify permissions after build: `ls -la build/index.js` should show `-rwxr-xr-x`

---

### 4. File Inclusion Strategy

**Question**: Should we use `.npmignore` or package.json `files` field?

**Decision**: Use `files` field in package.json (allowlist approach)

**Rationale**:
- Allowlist is safer: only ships explicitly listed files
- Blocklist (`.npmignore`) risks accidentally publishing sensitive files
- `files` is self-documenting in package.json
- npm automatically includes package.json, README, LICENSE regardless

**Alternatives Considered**:
- `.npmignore`: Requires maintaining deny list, error-prone
- No configuration: Ships everything, including dev files and tests

**Implementation Notes**:
- Current package.json has: `"files": ["build"]` ✅
- This already includes only the build directory
- npm auto-includes: package.json, README.md, LICENSE
- npm auto-excludes: node_modules, .git, *.swp, ._*

---

### 5. Package Metadata for Discoverability

**Question**: What metadata fields are critical for npm discoverability?

**Decision**: Enhance description, add keywords, set author, specify repository

```json
{
  "name": "mcp-rector",
  "version": "1.0.0",
  "description": "Model Context Protocol server for querying and filtering Rector PHP refactoring rules",
  "keywords": ["mcp", "rector", "php", "refactoring", "model-context-protocol", "llm"],
  "author": "Your Name <email@example.com>",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/mcp-rector.git"
  },
  "homepage": "https://github.com/username/mcp-rector#readme",
  "bugs": {
    "url": "https://github.com/username/mcp-rector/issues"
  }
}
```

**Rationale**:
- `description` appears in npm search results (critical for discovery)
- `keywords` enable finding via topic-based searches
- `repository` links enable GitHub integration and trust signals
- `homepage` and `bugs` improve user experience

**Alternatives Considered**:
- Minimal metadata: Harder to discover, appears unprofessional
- Scoped package: Not needed unless organization-specific

**Implementation Notes**:
- Current package.json has minimal metadata
- `description` is currently empty string
- `author` is empty string
- `keywords` is empty array
- All need to be populated before publishing

---

### 6. Build Process Requirements

**Question**: How to ensure compiled JavaScript includes proper shebang?

**Decision**: Add shebang to src/index.ts source file, verify TypeScript preserves it

**Rationale**:
- TypeScript compiler preserves comments at file start
- Shebang is treated as comment-like syntax
- Source-level shebang is most maintainable
- Build script already handles permissions

**Alternatives Considered**:
- Post-build script to inject shebang: More complex, fragile
- Manual file editing: Not repeatable

**Implementation Notes**:
- Check if src/index.ts has shebang (need to verify)
- If missing, add as first line: `#!/usr/bin/env node`
- Test that `tsc` preserves it in build/index.js
- If TypeScript strips it, use prepend build step

---

### 7. npx Behavior and Caching

**Question**: How does npx handle caching and version resolution?

**Decision**: Rely on default npx behavior; document version pinning for reproducibility

**Rationale**:
- npx caches packages in `~/.npm/_npx/` directory
- Running `npx mcp-rector` fetches latest version
- Running `npx mcp-rector@1.0.0` fetches specific version
- Cache improves performance on repeated runs
- No configuration needed on our side

**Alternatives Considered**:
- Custom caching strategy: Not possible, controlled by npm
- Always-latest strategy: Default behavior, no action needed

**Implementation Notes**:
- Document version pinning syntax: `npx mcp-rector@<version>`
- Mention cache location for troubleshooting
- Note that npx always checks for newer versions online

---

### 8. Cross-Platform Compatibility

**Question**: How does npx handle Windows vs Unix executable differences?

**Decision**: Trust npm's cross-platform wrapper generation

**Rationale**:
- npm automatically generates `.cmd` and PowerShell wrappers on Windows
- These wrappers invoke Node.js with the script path
- Unix systems use shebang + execute permission
- Both mechanisms are transparent to npx users
- No platform-specific code needed in package

**Alternatives Considered**:
- Platform-specific entry points: Unnecessary complexity
- Windows-only .cmd file: npm handles this automatically

**Implementation Notes**:
- Test on Windows requires Git Bash, PowerShell, or WSL
- Verify `npx mcp-rector` works in each Windows environment
- npm creates wrappers during package installation, not during build

---

### 9. Package Size Optimization

**Question**: What techniques keep package size under 5MB?

**Decision**: Ship only build output, exclude source, tests, and specs

**Rationale**:
- TypeScript source is not needed at runtime
- Tests are not needed by end users
- Specs are documentation, not runtime files
- Current `"files": ["build"]` already achieves this

**Alternatives Considered**:
- Ship source for debugging: Users can find on GitHub if needed
- Minify/bundle: Not necessary for server-side Node.js code

**Implementation Notes**:
- Verify package size: `npm pack --dry-run` shows contents and size
- Current package likely <1MB (TypeScript + MCP SDK + Zod dependencies)
- If size exceeds 5MB, investigate:
  - Remove unnecessary dependencies
  - Check for accidentally included large files
  - Use `npm ls` to audit dependency tree

---

### 10. Version Management Workflow

**Question**: What npm scripts should be added for version bumping?

**Decision**: Use `npm version` command with git tag integration

**Rationale**:
- `npm version patch|minor|major` updates package.json and creates git tag
- Automated version bumping reduces human error
- Git tags enable GitHub releases and version tracking
- Follows semantic versioning automatically

**Alternatives Considered**:
- Manual version editing: Error-prone
- Separate versioning tool: Unnecessary for simple cases

**Implementation Notes**:
- Add to AGENTS.md publishing workflow:
  ```bash
  npm version patch  # for bug fixes
  npm version minor  # for new features
  npm version major  # for breaking changes
  git push --follow-tags
  npm publish
  ```
- Ensure git working directory is clean before versioning
- Use `npm version --no-git-tag-version` if custom git workflow needed

---

## Summary of Decisions

| Area | Decision | Key Action |
|------|----------|------------|
| Binary config | `"bin": {"mcp-rector": "./build/index.js"}` | Add to package.json |
| Shebang | `#!/usr/bin/env node` at top of index.ts | Add to src/index.ts |
| Permissions | `chmod 755` in build script | Already configured ✅ |
| File inclusion | `"files": ["build"]` allowlist | Already configured ✅ |
| Metadata | Add description, keywords, author, repository | Update package.json |
| Cross-platform | Trust npm's automatic wrapper generation | Test on all platforms |
| Package size | Ship only build/ directory | Verify with `npm pack` |
| Versioning | Use `npm version` command | Document in AGENTS.md |

## Configuration Checklist

Before publishing:

- [ ] Add shebang to src/index.ts
- [ ] Add `bin` field to package.json
- [ ] Update `description` in package.json
- [ ] Add `keywords` array to package.json
- [ ] Set `author` in package.json
- [ ] Add `repository` field to package.json
- [ ] Add `homepage` field to package.json
- [ ] Add `bugs` field to package.json
- [ ] Verify `files` field includes ["build"]
- [ ] Verify build script includes `chmod 755`
- [ ] Test `npm pack --dry-run` to check size and contents
- [ ] Update README.md with npx usage instructions
- [ ] Document publishing workflow in AGENTS.md

## Open Questions Resolved

All research questions have been answered with actionable decisions. No blockers remain for Phase 1 design.

## References

- npm documentation: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
- npm bin field: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin
- npx documentation: https://docs.npmjs.com/cli/v10/commands/npx
- Semantic versioning: https://semver.org/
