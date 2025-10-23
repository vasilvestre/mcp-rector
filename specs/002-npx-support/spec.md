# Feature Specification: NPX Execution Support

**Feature Branch**: `002-npx-support`  
**Created**: 2025-10-23  
**Status**: Draft  
**Input**: User description: "I want this mcp server to be runnable without downloading it using npx"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick MCP Server Launch (Priority: P1)

A developer wants to test the Rector MCP server without installing it locally. They run `npx mcp-rector` from their terminal and the server starts immediately, ready to accept MCP connections.

**Why this priority**: This is the core functionality - enabling frictionless access to the server. It removes installation barriers and allows users to try the tool instantly.

**Independent Test**: Can be fully tested by running `npx mcp-rector` from a fresh environment and verifying the server starts and accepts MCP protocol connections. Delivers immediate value by enabling quick testing and prototyping.

**Acceptance Scenarios**:

1. **Given** the package is published to npm, **When** a user runs `npx mcp-rector`, **Then** the server starts and listens for MCP connections
2. **Given** the user has never installed the package before, **When** they run `npx mcp-rector`, **Then** npm downloads the package automatically and starts the server
3. **Given** the server is running via npx, **When** an MCP client connects, **Then** all Rector rule tools function correctly

---

### User Story 2 - Version-Specific Execution (Priority: P2)

A developer wants to test a specific version of the MCP server without affecting their local installation. They run `npx mcp-rector@1.2.3` and the specified version executes.

**Why this priority**: Enables testing across versions and ensures reproducible environments. Important for debugging and version comparisons, but not required for basic usage.

**Independent Test**: Can be tested by running `npx mcp-rector@<version>` with different version numbers and verifying each version executes correctly.

**Acceptance Scenarios**:

1. **Given** multiple versions are published to npm, **When** a user runs `npx mcp-rector@1.0.0`, **Then** version 1.0.0 executes
2. **Given** a user specifies a non-existent version, **When** they run `npx mcp-rector@99.99.99`, **Then** they receive a clear error message indicating the version doesn't exist

---

### User Story 3 - CI/CD Integration (Priority: P3)

An automation system needs to run the Rector MCP server as part of a pipeline without manual installation steps. The system executes `npx mcp-rector` in the pipeline script and the server runs successfully.

**Why this priority**: Enables automation workflows, but depends on the core npx functionality from P1. Most users will use P1 first before integrating into CI/CD.

**Independent Test**: Can be tested by running `npx mcp-rector` in a fresh container or CI environment and verifying successful execution.

**Acceptance Scenarios**:

1. **Given** a CI/CD pipeline script, **When** the script runs `npx mcp-rector`, **Then** the server executes without requiring pre-installation
2. **Given** a clean Docker container, **When** `npx mcp-rector` is executed, **Then** the server starts successfully

---

### Edge Cases

- What happens when the package is not published to npm registry?
- What happens when the user's npm registry is unreachable?
- How does the system handle network interruptions during npx download?
- What happens when the package binary permissions are incorrect?
- How does the system behave when executed in an environment without Node.js installed?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Package MUST be published to npm registry with public access
- **FR-002**: Package MUST include a valid binary entry point that can be executed via npx
- **FR-003**: Binary entry point MUST have proper shebang and execute permissions
- **FR-004**: Package MUST include all runtime dependencies required for execution
- **FR-005**: Package MUST build and include all necessary compiled files before publishing
- **FR-006**: Package metadata MUST specify the correct main entry point and binary mapping
- **FR-007**: Executed server MUST function identically whether run via npx or local installation
- **FR-008**: Package MUST handle missing or invalid command-line arguments gracefully
- **FR-009**: Server MUST provide clear output indicating it has started successfully
- **FR-010**: Package MUST work on all platforms supported by Node.js (Linux, macOS, Windows)

### Key Entities *(include if feature involves data)*

- **NPM Package**: Published artifact containing compiled TypeScript code, dependencies, and metadata required for npx execution
- **Binary Entry Point**: Executable script mapped to package name that serves as the server startup command

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can execute the server via `npx mcp-rector` within 30 seconds on a standard broadband connection
- **SC-002**: Server starts successfully in 100% of attempts on systems with Node.js 18+ installed
- **SC-003**: Users can connect an MCP client and execute Rector rule queries immediately after npx execution
- **SC-004**: Package download size remains under 5MB to ensure fast npx execution
- **SC-005**: Execution works identically across Linux, macOS, and Windows environments

## Scope *(mandatory)*

### In Scope

- Publishing package to npm registry
- Configuring package.json for npx compatibility
- Ensuring binary has proper permissions and shebang
- Including all necessary build artifacts and dependencies in published package
- Testing npx execution on major platforms

### Out of Scope

- Custom npm registry support (private registries)
- Offline/cached execution scenarios
- Package version management and deprecation strategies
- Advanced CLI argument parsing or configuration options
- Performance optimization beyond basic functionality

## Assumptions *(mandatory)*

- Users have Node.js version 18 or higher installed
- Users have internet access to npm registry
- The package name "mcp-rector" is available on npm registry
- Current TypeScript build process produces valid, executable output
- Users have basic familiarity with npm/npx commands
- npm registry is accessible and responsive

## Dependencies *(optional)*

### External Dependencies

- NPM registry availability and access
- Node.js runtime environment (v18+)
- TypeScript compiler for build process
- npm CLI tools for publishing

### Feature Dependencies

- None - this is a deployment/distribution feature that doesn't depend on other features

## Non-Functional Requirements *(optional)*

### Performance

- Server startup time via npx should be under 5 seconds after package download completes
- Package download time should be under 30 seconds on standard broadband (10+ Mbps)

### Security

- Package MUST NOT include sensitive information or credentials
- Published package MUST NOT include development dependencies or test files
- Binary execution MUST NOT require elevated privileges

### Reliability

- Server MUST start successfully on all supported platforms
- npx execution MUST fail gracefully with clear error messages when preconditions are not met
- Package MUST pass npm publish verification checks

### Maintainability

- Package.json configuration MUST be documented
- Publishing process MUST be repeatable and documented
- Version bumping MUST follow semantic versioning

## Open Questions *(optional)*

- Should we provide a custom npx command name different from the package name?
- Should we add telemetry to track npx usage vs. local installation usage?
- Should we support environment variable configuration for the server when run via npx?
