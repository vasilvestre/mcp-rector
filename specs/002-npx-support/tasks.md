# Implementation Tasks: NPX Execution Support

**Feature**: 002-npx-support  
**Date**: 2025-10-23  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

## Implementation Approach

This feature is **configuration-based** rather than code-driven. Test-Driven Development is not applicable for package metadata changes. Instead, we'll use a **validation-driven approach**:

1. Make configuration changes
2. Validate with `npm pack --dry-run`
3. Test npx execution in clean environment
4. Verify cross-platform compatibility
5. Publish and validate post-publish

## Task Breakdown

### Task Group 1: Package Configuration (Priority: P1)

#### Task 1.1: Fix Binary Entry Point Mapping

**Status**: Completed  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Update package.json bin field from "weather" (template leftover) to "mcp-rector"

**Acceptance Criteria**:
- [X] `package.json` has `"bin": {"mcp-rector": "./build/index.js"}`
- [X] No "weather" references remain in package.json
- [X] Binary path points to correct compiled entry point

**Implementation Steps**:
1. Open `package.json`
2. Change `"weather"` to `"mcp-rector"` in bin object
3. Verify path `./build/index.js` is correct
4. Save file

**Validation**:
```bash
grep -q '"mcp-rector"' package.json && echo "✅ Binary name correct"
grep -q '"weather"' package.json && echo "❌ Template name still present" || echo "✅ No template name"
```

---

#### Task 1.2: Add Package Description

**Status**: Completed  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Add meaningful description for npm search discoverability

**Acceptance Criteria**:
- [X] `description` field is non-empty
- [X] Description accurately describes the package purpose
- [X] Description mentions "MCP", "Rector", and "PHP"
- [X] Description is concise (under 150 characters)

**Implementation Steps**:
1. Open `package.json`
2. Replace `"description": ""` with:
   ```
   "description": "Model Context Protocol server for querying and filtering Rector PHP refactoring rules"
   ```
3. Save file

**Validation**:
```bash
jq -r '.description' package.json | grep -q "MCP\|Model Context Protocol" && echo "✅ Description added"
```

---

#### Task 1.3: Add Keywords for Discoverability

**Status**: Completed  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Add relevant keywords to improve npm search results

**Acceptance Criteria**:
- [X] `keywords` array contains at least 5 relevant terms
- [X] Keywords include: "mcp", "rector", "php", "refactoring"
- [X] Keywords include: "model-context-protocol" or "llm"
- [X] No duplicate or irrelevant keywords

**Implementation Steps**:
1. Open `package.json`
2. Replace `"keywords": []` with:
   ```json
   "keywords": ["mcp", "rector", "php", "refactoring", "model-context-protocol", "llm", "ai"]
   ```
3. Save file

**Validation**:
```bash
jq '.keywords | length' package.json # Should output >= 5
jq -r '.keywords[]' package.json | grep -q "mcp" && echo "✅ Keywords added"
```

---

#### Task 1.4: Set Author Information

**Status**: Completed  
**Effort**: 2 minutes  
**Risk**: Low  

**Description**: Add author field with name and email

**Acceptance Criteria**:
- [X] `author` field is non-empty
- [X] Author follows format: "Name <email@example.com>" or "Name"
- [X] Email is valid (if included)

**Implementation Steps**:
1. Open `package.json`
2. Determine maintainer name and email
3. Replace `"author": ""` with appropriate value
4. Save file

**Validation**:
```bash
jq -r '.author' package.json | grep -qv '^$' && echo "✅ Author set"
```

---

#### Task 1.5: Add Repository Metadata

**Status**: Completed  
**Effort**: 10 minutes  
**Risk**: Low  

**Description**: Add repository, homepage, and bugs fields for GitHub integration

**Acceptance Criteria**:
- [X] `repository` field has type and url
- [X] `homepage` field points to GitHub readme
- [X] `bugs` field points to GitHub issues
- [X] URLs are valid and publicly accessible

**Implementation Steps**:
1. Open `package.json`
2. Add repository field:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/USERNAME/mcp-rector.git"
   }
   ```
3. Add homepage field:
   ```json
   "homepage": "https://github.com/USERNAME/mcp-rector#readme"
   ```
4. Add bugs field:
   ```json
   "bugs": {
     "url": "https://github.com/USERNAME/mcp-rector/issues"
   }
   ```
5. Replace USERNAME with actual GitHub username
6. Save file

**Validation**:
```bash
jq -e '.repository.url' package.json && echo "✅ Repository URL set"
jq -e '.homepage' package.json && echo "✅ Homepage set"
jq -e '.bugs.url' package.json && echo "✅ Bugs URL set"
```

---

### Task Group 2: Executable Configuration (Priority: P1)

#### Task 2.1: Add Shebang to Source File

**Status**: Completed  
**Effort**: 2 minutes  
**Risk**: Low  

**Description**: Add Node.js shebang to src/index.ts for Unix executable support

**Acceptance Criteria**:
- [X] First line of `src/index.ts` is `#!/usr/bin/env node`
- [X] No blank lines before shebang
- [X] Shebang is preserved after TypeScript compilation

**Implementation Steps**:
1. Open `src/index.ts`
2. Check if shebang already exists (line 1)
3. If missing, add `#!/usr/bin/env node` as very first line
4. Ensure no blank lines before it
5. Save file

**Validation**:
```bash
head -n1 src/index.ts | grep -q '#!/usr/bin/env node' && echo "✅ Shebang present"
```

---

#### Task 2.2: Verify Build Process Preserves Shebang

**Status**: Completed  
**Effort**: 5 minutes  
**Risk**: Medium  

**Description**: Ensure TypeScript compiler preserves shebang in compiled output

**Acceptance Criteria**:
- [X] Running `npm run build` preserves shebang in `build/index.js`
- [X] First line of `build/index.js` is `#!/usr/bin/env node`
- [X] File has executable permissions (755)

**Implementation Steps**:
1. Run `npm run build`
2. Check first line of `build/index.js`:
   ```bash
   head -n1 build/index.js
   ```
3. Verify it shows `#!/usr/bin/env node`
4. Check permissions:
   ```bash
   ls -la build/index.js
   ```
5. Verify it shows `-rwxr-xr-x` (755)

**Validation**:
```bash
npm run build
head -n1 build/index.js | grep -q '#!/usr/bin/env node' && echo "✅ Shebang preserved"
stat -c "%a" build/index.js | grep -q '755' && echo "✅ Permissions correct"
```

**Contingency**: If TypeScript strips shebang, add build step to prepend it:
```bash
"build": "tsc && sed -i '1i#!/usr/bin/env node' build/index.js && chmod 755 build/index.js"
```

---

### Task Group 3: Pre-Publish Validation (Priority: P1)

#### Task 3.1: Validate Package Contents

**Status**: Completed  
**Effort**: 10 minutes  
**Risk**: Low  

**Description**: Use npm pack to preview package contents and verify only necessary files are included

**Acceptance Criteria**:
- [X] `npm pack --dry-run` completes without errors
- [X] Output shows only: package.json, README.md, build/ directory
- [X] No source files (src/) are included
- [X] No spec files (specs/) are included
- [X] No test files are included

**Implementation Steps**:
1. Run `npm pack --dry-run` from repository root
2. Review "files included" output
3. Verify only allowed files are present
4. Check for accidentally included files

**Validation**:
```bash
npm pack --dry-run 2>&1 | grep -q "build/" && echo "✅ Build directory included"
npm pack --dry-run 2>&1 | grep -q "src/" && echo "❌ Source included (should not be)" || echo "✅ Source excluded"
npm pack --dry-run 2>&1 | grep -q "specs/" && echo "❌ Specs included (should not be)" || echo "✅ Specs excluded"
```

---

#### Task 3.2: Validate Package Size

**Status**: Completed  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Verify package tarball size is under 5MB threshold

**Acceptance Criteria**:
- [X] Package size is <5MB (5,000,000 bytes)
- [X] Size is reported by `npm pack --dry-run`
- [X] If >5MB, identify and remove unnecessary files

**Implementation Steps**:
1. Run `npm pack --dry-run` and note "unpacked size"
2. Compare to 5MB threshold
3. If too large, analyze contents:
   ```bash
   npm pack
   tar -tzf mcp-rector-1.0.0.tgz | xargs -I {} sh -c 'echo $(tar -xzf mcp-rector-1.0.0.tgz --to-stdout {} | wc -c) {}'
   ```
4. Remove large unnecessary files

**Validation**:
```bash
npm pack --dry-run 2>&1 | grep -oP 'unpacked size:\s*\K[\d.]+\s*[kM]B' | awk '{
  if ($2 == "MB" && $1 < 5) print "✅ Size OK: " $1 $2
  else if ($2 == "kB") print "✅ Size OK: " $1 $2
  else print "❌ Size too large: " $1 $2
}'
```

---

#### Task 3.3: Validate JSON Schema Compliance

**Status**: Completed  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Verify package.json matches contract defined in contracts/package-contract.json

**Acceptance Criteria**:
- [X] All required fields are present
- [X] All fields have correct types
- [X] Version follows semantic versioning
- [X] URLs are valid format

**Implementation Steps**:
1. Read `specs/002-npx-support/contracts/package-contract.json`
2. Manually verify each required field in `package.json`
3. Check types and formats match schema

**Validation**:
```bash
# Check required fields
for field in name version description keywords author license bin files; do
  jq -e ".$field" package.json >/dev/null 2>&1 && echo "✅ $field present" || echo "❌ $field missing"
done
```

---

### Task Group 4: Local Testing (Priority: P1)

#### Task 4.1: Test Local npx Execution

**Status**: Completed  
**Effort**: 10 minutes  
**Risk**: Medium  

**Description**: Test npx execution using local package before publishing

**Acceptance Criteria**:
- [X] `npm pack` creates tarball
- [X] `npx ./mcp-rector-1.0.0.tgz` starts server
- [X] Server outputs startup message
- [X] Server accepts MCP connections (test with MCP Inspector)
- [X] All three tools are available (list, filter, search)

**Implementation Steps**:
1. Ensure all previous tasks are complete
2. Run `npm run build` to compile
3. Run `npm pack` to create tarball
4. Test execution:
   ```bash
   npx ./mcp-rector-1.0.0.tgz
   ```
5. Verify startup message appears
6. In another terminal, test MCP connection (if applicable)
7. Press Ctrl+C to stop server

**Validation**:
```bash
npm pack
timeout 5 npx ./mcp-rector-*.tgz 2>&1 | grep -q "MCP Rector server running" && echo "✅ Server starts via npx"
rm -f mcp-rector-*.tgz  # Cleanup
```

---

#### Task 4.2: Test Direct Execution of Binary

**Status**: Completed  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Test that compiled binary can be executed directly (Unix systems)

**Acceptance Criteria**:
- [X] `./build/index.js` executes without `node` prefix
- [X] Server starts and outputs startup message
- [X] Shebang and permissions are correct

**Implementation Steps**:
1. Ensure build is up-to-date: `npm run build`
2. Execute binary directly:
   ```bash
   ./build/index.js
   ```
3. Verify server starts (Ctrl+C to stop)
4. Check for permission errors

**Validation**:
```bash
timeout 5 ./build/index.js 2>&1 | grep -q "MCP Rector server running" && echo "✅ Direct execution works"
```

**Note**: This test only works on Unix/Linux/macOS. Windows testing covered in Task 5.3.

---

### Task Group 5: Cross-Platform Testing (Priority: P2)

#### Task 5.1: Test on Linux

**Status**: Pending  
**Effort**: 15 minutes  
**Risk**: Low  

**Description**: Verify npx execution works on Linux (native or VM/Docker)

**Acceptance Criteria**:
- [ ] npx downloads package successfully
- [ ] Server starts without errors
- [ ] MCP Inspector can connect
- [ ] All three tools execute correctly

**Implementation Steps**:
1. Prepare Linux environment (native, VM, or Docker container)
2. Ensure Node.js 18+ is installed: `node --version`
3. From clean directory (no local installation):
   ```bash
   npx ./path/to/mcp-rector-1.0.0.tgz
   ```
4. Verify startup message
5. Test MCP tool execution

**Validation**:
```bash
# In Linux environment
timeout 5 npx ./mcp-rector-*.tgz 2>&1 | grep -q "running" && echo "✅ Linux works"
```

---

#### Task 5.2: Test on macOS

**Status**: Pending  
**Effort**: 15 minutes  
**Risk**: Low  

**Description**: Verify npx execution works on macOS

**Acceptance Criteria**:
- [ ] npx downloads package successfully
- [ ] Server starts without errors
- [ ] No macOS-specific permission issues
- [ ] All tools function correctly

**Implementation Steps**:
1. Access macOS system (physical or VM)
2. Ensure Node.js 18+ is installed: `node --version`
3. From clean directory:
   ```bash
   npx ./path/to/mcp-rector-1.0.0.tgz
   ```
4. Verify startup message
5. Test MCP connection

**Validation**:
```bash
# In macOS environment
timeout 5 npx ./mcp-rector-*.tgz 2>&1 | grep -q "running" && echo "✅ macOS works"
```

---

#### Task 5.3: Test on Windows

**Status**: Pending  
**Effort**: 20 minutes  
**Risk**: Medium  

**Description**: Verify npx execution works on Windows (PowerShell, cmd, and WSL if available)

**Acceptance Criteria**:
- [ ] npx works in PowerShell
- [ ] npx works in cmd.exe
- [ ] npx works in WSL (if available)
- [ ] npm creates wrapper scripts (.cmd, .ps1) correctly
- [ ] Server starts without errors

**Implementation Steps**:
1. Access Windows system
2. Ensure Node.js 18+ is installed: `node --version`
3. **Test in PowerShell**:
   ```powershell
   npx .\path\to\mcp-rector-1.0.0.tgz
   ```
4. **Test in cmd.exe**:
   ```cmd
   npx .\path\to\mcp-rector-1.0.0.tgz
   ```
5. **Test in WSL** (if available):
   ```bash
   npx ./path/to/mcp-rector-1.0.0.tgz
   ```
6. Verify startup in each environment

**Validation**:
```powershell
# In PowerShell
timeout /t 5 npx .\mcp-rector-*.tgz 2>&1 | Select-String "running"
```

**Common Issues**:
- PowerShell execution policy: May need `Set-ExecutionPolicy RemoteSigned`
- Path separators: Windows uses `\`, Unix uses `/`
- npm creates `.cmd` and `.ps1` wrappers automatically

---

### Task Group 6: Documentation (Priority: P2)

#### Task 6.1: Update README with npx Usage

**Status**: Completed  
**Effort**: 15 minutes  
**Risk**: Low  

**Description**: Add npx execution instructions to README.md

**Acceptance Criteria**:
- [X] README has "Installation" or "Usage" section
- [X] npx command is documented: `npx mcp-rector`
- [X] Version-specific syntax is documented: `npx mcp-rector@1.0.0`
- [X] Alternative local installation is documented
- [X] Example output is shown

**Implementation Steps**:
1. Open `README.md`
2. Find or create "Installation" section
3. Add npx usage before local installation:
   ```markdown
   ## Installation

   ### Quick Start (No Installation Required)

   Run the MCP Rector server directly without installation:

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
   ```
4. Save file

**Validation**:
```bash
grep -q "npx mcp-rector" README.md && echo "✅ npx documented"
```

---

#### Task 6.2: Add Troubleshooting Section

**Status**: Completed  
**Effort**: 15 minutes  
**Risk**: Low  

**Description**: Document common npx issues and solutions

**Acceptance Criteria**:
- [X] README has "Troubleshooting" section
- [X] Covers permission issues
- [X] Covers network/registry issues
- [X] Covers Node.js version issues
- [X] Covers cache clearing

**Implementation Steps**:
1. Open `README.md`
2. Add "Troubleshooting" section:
   ```markdown
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
   If experiencing issues, clear the npx cache:
   ```bash
   rm -rf ~/.npm/_npx
   ```
   ```
3. Save file

**Validation**:
```bash
grep -q "Troubleshooting" README.md && echo "✅ Troubleshooting added"
```

---

#### Task 6.3: Document Publishing Workflow in AGENTS.md

**Status**: Completed  
**Effort**: 10 minutes  
**Risk**: Low  

**Description**: Add npm publishing instructions to AGENTS.md for maintainers

**Acceptance Criteria**:
- [X] AGENTS.md has "Publishing" or "Release" section
- [X] Version bumping commands documented
- [X] Pre-publish checklist documented
- [X] Publishing command documented
- [X] Post-publish verification steps documented

**Implementation Steps**:
1. Open `AGENTS.md`
2. Add "Publishing Workflow" section:
   ```markdown
   ## Publishing Workflow

   ### Pre-Publish Checklist
   - [ ] All tests pass: `npm test`
   - [ ] Build succeeds: `npm run build`
   - [ ] Package size <5MB: `npm pack --dry-run`
   - [ ] README is up-to-date
   - [ ] CHANGELOG updated (if exists)

   ### Version Management
   Bump version using semantic versioning:
   ```bash
   npm version patch  # Bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # New features (1.0.0 -> 1.1.0)
   npm version major  # Breaking changes (1.0.0 -> 2.0.0)
   ```

   ### Publishing
   ```bash
   npm publish
   git push --follow-tags
   ```

   ### Post-Publish Verification
   ```bash
   npm view mcp-rector  # View published package info
   npx mcp-rector       # Test npx execution
   ```
   ```
3. Save file

**Validation**:
```bash
grep -q "npm publish" AGENTS.md && echo "✅ Publishing workflow documented"
```

---

### Task Group 7: Publishing (Priority: P1)

#### Task 7.1: Check Package Name Availability

**Status**: Pending  
**Effort**: 5 minutes  
**Risk**: High  

**Description**: Verify "mcp-rector" package name is available on npm registry

**Acceptance Criteria**:
- [ ] Package name "mcp-rector" is available OR
- [ ] Alternative name is chosen and updated in package.json

**Implementation Steps**:
1. Check name availability:
   ```bash
   npm view mcp-rector
   ```
2. If returns 404: Name is available ✅
3. If returns package info: Name is taken, choose alternative
4. Update package.json if name changed

**Validation**:
```bash
npm view mcp-rector 2>&1 | grep -q "404" && echo "✅ Name available" || echo "⚠️ Name taken"
```

**Contingency**: If name taken, consider:
- `@username/mcp-rector` (scoped package)
- `mcp-rector-server`
- `rector-mcp`

---

#### Task 7.2: Authenticate with npm Registry

**Status**: Pending  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Ensure npm authentication is configured for publishing

**Acceptance Criteria**:
- [ ] `npm whoami` returns username
- [ ] npm account has publish permissions
- [ ] Two-factor authentication handled (if enabled)

**Implementation Steps**:
1. Check authentication:
   ```bash
   npm whoami
   ```
2. If not authenticated:
   ```bash
   npm login
   ```
3. Follow prompts for username, password, email
4. Handle 2FA if enabled

**Validation**:
```bash
npm whoami && echo "✅ Authenticated"
```

---

#### Task 7.3: Publish Package to npm

**Status**: Pending  
**Effort**: 5 minutes  
**Risk**: Medium  

**Description**: Publish package to npm registry with public access

**Acceptance Criteria**:
- [ ] Package publishes without errors
- [ ] Package is publicly accessible
- [ ] npm returns success message
- [ ] Version number is correct

**Implementation Steps**:
1. Final validation:
   ```bash
   npm run build
   npm test
   npm pack --dry-run
   ```
2. Publish:
   ```bash
   npm publish --access public
   ```
3. Verify success message
4. Note published version number

**Validation**:
```bash
npm publish --access public 2>&1 | grep -q "+" && echo "✅ Published successfully"
```

**Note**: This is a one-time action. Cannot be undone (can only deprecate versions).

---

#### Task 7.4: Create Git Tag and Push

**Status**: Pending  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Tag release in Git and push to remote repository

**Acceptance Criteria**:
- [ ] Git tag matches published version (v1.0.0)
- [ ] Tag is pushed to remote
- [ ] Commit is pushed to remote

**Implementation Steps**:
1. If using `npm version`, tag is already created
2. If manually published:
   ```bash
   git tag v1.0.0
   ```
3. Push with tags:
   ```bash
   git push --follow-tags
   ```

**Validation**:
```bash
git tag -l | grep -q "v1.0.0" && echo "✅ Tag created"
git ls-remote --tags origin | grep -q "v1.0.0" && echo "✅ Tag pushed"
```

---

### Task Group 8: Post-Publish Validation (Priority: P1)

#### Task 8.1: Verify Package on npm Website

**Status**: Pending  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Confirm package appears correctly on npmjs.com

**Acceptance Criteria**:
- [ ] Package page exists: https://www.npmjs.com/package/mcp-rector
- [ ] Description is displayed
- [ ] Keywords are displayed
- [ ] README is rendered correctly
- [ ] Version number matches published version

**Implementation Steps**:
1. Navigate to https://www.npmjs.com/package/mcp-rector
2. Verify all metadata displays correctly
3. Check README formatting
4. Verify install instructions work

**Validation**:
Manual verification via browser

---

#### Task 8.2: Test Published Package with npx

**Status**: Pending  
**Effort**: 10 minutes  
**Risk**: Medium  

**Description**: Test that published package executes via npx from fresh environment

**Acceptance Criteria**:
- [ ] `npx mcp-rector` downloads and starts server
- [ ] Download completes in <30 seconds on broadband
- [ ] Server starts in <5 seconds after download
- [ ] All tools function correctly

**Implementation Steps**:
1. Clear npx cache:
   ```bash
   rm -rf ~/.npm/_npx
   ```
2. Run from published package:
   ```bash
   npx mcp-rector
   ```
3. Verify download happens
4. Verify startup message
5. Test with MCP Inspector (if available)

**Validation**:
```bash
rm -rf ~/.npm/_npx
time npx mcp-rector 2>&1 | tee /dev/tty | grep -q "running" && echo "✅ Published package works"
```

---

#### Task 8.3: Test Version-Specific Execution

**Status**: Pending  
**Effort**: 5 minutes  
**Risk**: Low  

**Description**: Verify version pinning works with npx

**Acceptance Criteria**:
- [ ] `npx mcp-rector@1.0.0` executes specific version
- [ ] Invalid version shows clear error
- [ ] Multiple versions can coexist in cache

**Implementation Steps**:
1. Test specific version:
   ```bash
   npx mcp-rector@1.0.0
   ```
2. Test invalid version:
   ```bash
   npx mcp-rector@99.99.99
   ```
3. Verify error message is clear

**Validation**:
```bash
timeout 5 npx mcp-rector@1.0.0 2>&1 | grep -q "running" && echo "✅ Version pinning works"
npx mcp-rector@99.99.99 2>&1 | grep -q "404\|not found" && echo "✅ Invalid version handled"
```

---

#### Task 8.4: Verify MCP Tool Functionality

**Status**: Pending  
**Effort**: 10 minutes  
**Risk**: Low  

**Description**: Confirm all three MCP tools work when server launched via npx

**Acceptance Criteria**:
- [ ] `list-rector-rules` tool returns rules
- [ ] `filter-rector-rules` tool accepts ruleSet parameter
- [ ] `search-rector-rules` tool accepts query parameter
- [ ] All tools return expected data structure

**Implementation Steps**:
1. Start server via npx
2. Connect MCP Inspector or client
3. Test each tool:
   - list-rector-rules
   - filter-rector-rules with ruleSet="PHP80"
   - search-rector-rules with query="interface"
4. Verify responses match expected schema

**Validation**:
Manual testing with MCP Inspector or programmatic MCP client

---

## Task Summary

### By Priority
- **P1 (Critical)**: Tasks 1.1-2.2, 3.1-3.3, 4.1-4.2, 7.1-7.4, 8.1-8.4 (19 tasks)
- **P2 (Important)**: Tasks 5.1-5.3, 6.1-6.3 (6 tasks)

### By Effort
- **Quick (<5 min)**: 10 tasks
- **Medium (5-15 min)**: 11 tasks
- **Longer (15-20 min)**: 4 tasks

### By Risk
- **Low**: 20 tasks
- **Medium**: 4 tasks
- **High**: 1 task (name availability)

## Execution Order

Recommended sequence:

1. **Phase 1: Configuration** (30 minutes)
   - Tasks 1.1-1.5: Update package.json metadata
   - Task 2.1: Add shebang to source

2. **Phase 2: Build & Validation** (20 minutes)
   - Task 2.2: Verify build preserves shebang
   - Tasks 3.1-3.3: Pre-publish validation

3. **Phase 3: Local Testing** (15 minutes)
   - Tasks 4.1-4.2: Test local execution

4. **Phase 4: Documentation** (40 minutes)
   - Tasks 6.1-6.3: Update README and AGENTS.md

5. **Phase 5: Publishing** (20 minutes)
   - Tasks 7.1-7.4: Publish to npm

6. **Phase 6: Post-Publish Validation** (30 minutes)
   - Tasks 8.1-8.4: Verify published package

7. **Phase 7: Cross-Platform Testing** (50 minutes)
   - Tasks 5.1-5.3: Test on all platforms

**Total Estimated Time**: 3-4 hours (excluding cross-platform testing setup time)

## Success Metrics (Aligned with Spec)

- [ ] **SC-001**: Users can execute via `npx mcp-rector` within 30 seconds
- [ ] **SC-002**: Server starts successfully in 100% of attempts on Node.js 18+
- [ ] **SC-003**: MCP clients can connect immediately after npx execution
- [ ] **SC-004**: Package download size <5MB
- [ ] **SC-005**: Execution works on Linux, macOS, Windows

## Rollback Plan

If publishing fails or critical issues discovered:

1. **Before Publishing**: Simply revert configuration changes
2. **After Publishing**: Use `npm deprecate mcp-rector@<version> "<reason>"`
3. **Fix and republish**: Bump version with `npm version patch` and republish

**Note**: npm does not allow deleting published versions. Use deprecation for critical issues.

## Dependencies

- npm account with publish permissions
- Access to Linux, macOS, Windows for testing (or CI/CD environments)
- MCP Inspector or MCP client for functional testing
- GitHub repository access for tagging releases

## Next Steps

After all tasks complete:

1. Update feature status to "Released" in spec.md
2. Create GitHub release with changelog
3. Announce on relevant channels (if applicable)
4. Monitor npm download stats and issue reports
5. Respond to user feedback and bug reports
