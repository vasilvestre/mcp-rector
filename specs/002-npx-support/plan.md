# Implementation Plan: NPX Execution Support

**Branch**: `002-npx-support` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-npx-support/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to execute the MCP Rector server directly via `npx mcp-rector` without prior installation. This involves configuring npm package metadata, ensuring proper binary entry points with correct permissions, and publishing to the npm registry. The feature enables frictionless access for testing, version-specific execution for reproducibility, and CI/CD integration without installation steps.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with Node.js 18+  
**Primary Dependencies**: @modelcontextprotocol/sdk, Zod (already in use)  
**Storage**: N/A (no data persistence required for this feature)  
**Testing**: Node.js built-in test runner (`node:test`)  
**Target Platform**: Cross-platform (Linux, macOS, Windows) via Node.js  
**Project Type**: Single project - CLI/MCP server  
**Performance Goals**: Package download <30s on 10+ Mbps, server startup <5s after download  
**Constraints**: Package size <5MB, no elevated privileges required, Node.js 18+ required  
**Scale/Scope**: Single npm package, ~10 configuration changes in package.json

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. MCP Tool Contracts
✅ **Pass** - This is a packaging/deployment feature that doesn't modify existing MCP tool contracts. All existing tools remain unchanged.

### II. Structured Error Handling
✅ **Pass** - No new error handling logic required. Existing MCP server error handling covers all runtime scenarios. npx execution failures will be handled by npm/Node.js runtime.

### III. Test-First Development
⚠️ **Advisory** - This feature is primarily configuration-based (package.json metadata, build settings). Testing will focus on:
- Integration tests for npx execution in clean environments
- Cross-platform verification (Linux, macOS, Windows)
- Package size validation
- Binary permissions verification

No TDD required for configuration changes, but post-deployment validation tests are mandatory.

### IV. Input Validation
✅ **Pass** - No new user inputs introduced. Command-line arguments are handled by existing server initialization. Invalid npx usage will be caught by npm CLI.

### V. Documentation & Examples
✅ **Pass** - README.md will be updated with npx usage examples. Publishing process will be documented in AGENTS.md or dedicated publishing documentation.

### Technology Stack & Standards
✅ **Pass** - Uses existing TypeScript, build process, and npm tooling. No new technologies introduced.

### Development Workflow
✅ **Pass** - Changes will follow standard review process. Testing gates include manual npx verification across platforms before publishing.

**Overall Assessment**: ✅ All gates passed with advisory note on testing approach.

## Project Structure

### Documentation (this feature)

```text
specs/002-npx-support/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - npm publishing best practices
├── data-model.md        # Phase 1 output - package metadata structure
├── quickstart.md        # Phase 1 output - npx usage guide
├── contracts/           # Phase 1 output - package.json contract
│   └── package-contract.json
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
# Single project structure (existing)
src/
├── models/           # Existing models (no changes)
├── services/         # Existing services (no changes)
├── tools/            # Existing MCP tools (no changes)
└── index.ts          # Entry point (may need shebang update)

build/                # TypeScript compilation output
└── index.js          # Compiled entry point with executable permissions

# Root configuration files
package.json          # PRIMARY CHANGE: bin field, files field, metadata
tsconfig.json         # May need adjustments for build output
.npmignore            # NEW: control published files
README.md             # Update with npx instructions
```

**Structure Decision**: This is a deployment/packaging feature affecting repository root configuration files, not source code structure. Primary changes are to package.json metadata and build configuration. No new source directories or files required.

## Complexity Tracking

> **No violations to justify** - All constitution checks passed.

## Phase 0: Research & Planning

### Research Questions

1. **npm Binary Configuration**
   - What is the correct `bin` field format in package.json for npx compatibility?
   - What shebang line is required for cross-platform Node.js execution?
   - How to ensure executable permissions are preserved during npm publish?

2. **npm Publishing Best Practices**
   - What files should be included/excluded via `files` field in package.json?
   - Should we use `.npmignore` or package.json `files` field?
   - What metadata fields are critical for discoverability (keywords, description)?
   - How to handle scoped vs unscoped package names?

3. **Build Process**
   - How to ensure compiled JavaScript includes proper shebang?
   - What build script modifications are needed for executable output?
   - How to validate package contents before publishing?

4. **Cross-Platform Compatibility**
   - How does npx handle Windows vs Unix executable differences?
   - Are there known issues with file permissions on Windows?
   - What testing is required for each platform?

5. **Version Management**
   - What npm scripts should be added for version bumping?
   - How to ensure consistent versioning between git tags and package.json?
   - What is the recommended pre-publish workflow?

### Research Tasks

- [ ] Research npm `bin` field configuration and best practices
- [ ] Investigate Node.js shebang requirements for cross-platform executables
- [ ] Review npm publishing workflow and required configuration
- [ ] Analyze npm `files` field vs `.npmignore` approaches
- [ ] Research npx caching and version resolution behavior
- [ ] Study cross-platform executable handling in npm ecosystem
- [ ] Identify package size optimization techniques
- [ ] Review semantic versioning and npm version management

### Research Output

Results will be documented in `research.md` with:
- **Decision**: Chosen approach for each research question
- **Rationale**: Why this approach was selected
- **Alternatives Considered**: What other options were evaluated
- **Implementation Notes**: Specific configuration values and commands

## Phase 1: Design & Contracts

### Data Model

File: `data-model.md`

**Entities:**

1. **NPM Package Metadata** (package.json)
   - name: string
   - version: string (semver)
   - description: string
   - bin: Record<string, string> (binary mappings)
   - files: string[] (included files/directories)
   - main: string (entry point)
   - keywords: string[]
   - author: string
   - license: string

2. **Binary Entry Point** (build/index.js)
   - shebang: string (#!/usr/bin/env node)
   - permissions: octal (755 executable)

3. **Published Package Structure**
   - Included: build/, package.json, README.md
   - Excluded: src/, tests/, .git/, node_modules/, specs/

### API Contracts

File: `contracts/package-contract.json`

This will contain the package.json schema with all required fields for npx compatibility.

### Quick Start Guide

File: `quickstart.md`

Will include:
1. Installation: `npx mcp-rector`
2. Version-specific execution: `npx mcp-rector@1.0.0`
3. CI/CD usage examples
4. Troubleshooting common npx issues
5. Publishing workflow for maintainers

### Agent Context Update

After Phase 1 completion:
- Run `.specify/scripts/bash/update-agent-context.sh opencode`
- Update AGENTS.md with npm publishing commands
- Add package.json configuration guidelines
- Document npx testing procedures

## Phase 2: Implementation Tasks

*Detailed tasks will be generated by `/speckit.tasks` command after Phase 0-1 completion.*

**High-Level Task Categories:**

1. **Package Configuration**
   - Update package.json with bin field
   - Configure files field for published content
   - Update metadata (description, keywords, author)
   - Add prepublish scripts

2. **Build Process Updates**
   - Add shebang to index.ts (if needed)
   - Configure TypeScript to preserve executable permissions
   - Update build script to chmod 755 build/index.js
   - Add package validation script

3. **Publishing Workflow**
   - Create .npmignore or refine files field
   - Add npm version management scripts
   - Document publishing process
   - Create pre-publish checklist

4. **Testing & Validation**
   - Test npx execution on Linux
   - Test npx execution on macOS
   - Test npx execution on Windows
   - Validate package size <5MB
   - Test version-specific execution
   - Test in clean Docker container

5. **Documentation Updates**
   - Update README.md with npx instructions
   - Add publishing guide to AGENTS.md
   - Document troubleshooting steps
   - Add CI/CD integration examples

## Success Metrics

Aligned with specification success criteria:

- **SC-001**: Users can execute via `npx mcp-rector` within 30 seconds on standard broadband
- **SC-002**: Server starts successfully in 100% of attempts on Node.js 18+
- **SC-003**: MCP clients can connect and execute queries immediately after npx execution
- **SC-004**: Package download size remains under 5MB
- **SC-005**: Execution works identically across Linux, macOS, Windows

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Package name unavailable on npm | Low | High | Check npm registry before starting, have backup name |
| Cross-platform permission issues | Medium | Medium | Test on all platforms before publishing, document Windows-specific setup |
| Package size exceeds 5MB | Low | Low | Validate before publish, exclude unnecessary files |
| Binary not found by npx | Low | High | Test npx execution in clean environment, validate bin field |
| Breaking existing local installations | Low | Medium | Ensure no breaking changes to entry point, test both installation methods |

## Dependencies

### External Dependencies
- npm registry access (publishing credentials required)
- Node.js 18+ for testing environments
- Access to Linux, macOS, Windows for cross-platform testing
- npm CLI tools version 8+

### Internal Dependencies
- Existing build process must produce valid output
- All existing tests must pass before publishing
- README.md must be up-to-date

### Blocking Issues
None identified. This is a self-contained packaging change with no code dependencies.

## Timeline Estimate

- **Phase 0 (Research)**: 1-2 hours
- **Phase 1 (Design & Contracts)**: 1-2 hours
- **Phase 2 (Implementation)**: 2-4 hours
- **Testing & Validation**: 2-3 hours
- **Publishing & Documentation**: 1-2 hours

**Total Estimated Effort**: 7-13 hours

**Critical Path**: Research → Configuration → Testing → Publishing (sequential, no parallelization possible)

## Next Steps

1. Execute Phase 0: Run research tasks and document findings in `research.md`
2. Execute Phase 1: Generate data-model.md, contracts/, and quickstart.md
3. Update agent context with AGENTS.md modifications
4. Run `/speckit.tasks` to generate detailed implementation tasks
5. Begin implementation following TDD principles where applicable
