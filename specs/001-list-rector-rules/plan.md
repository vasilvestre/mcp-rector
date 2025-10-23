# Implementation Plan: List Available Rector Rules

**Branch**: `001-list-rector-rules` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-list-rector-rules/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement an MCP server tool that fetches, caches, and exposes Rector PHP refactoring rules with filtering and search capabilities. The system will fetch rule metadata from https://getrector.com/find-rule at runtime, cache it in-memory for the session, and provide three MCP tools: list all rules, filter by rule set, and search by keyword. Data quality is ensured by excluding rules with incomplete metadata.

## Technical Context

**Language/Version**: TypeScript (Node 16+, ES2022 target)  
**Primary Dependencies**: @modelcontextprotocol/sdk ^1.20.1, zod ^3.25.76, node-fetch or undici (for HTTP requests)  
**Storage**: In-memory cache (Map/Object) for session lifetime  
**Testing**: Node.js test runner or jest (NEEDS CLARIFICATION - currently no test framework configured)  
**Target Platform**: Node.js server (stdio transport for MCP)  
**Project Type**: Single project (MCP server)  
**Performance Goals**: <3s initial rule fetch, <1s filtering/search, <200ms cache hits  
**Constraints**: No persistence (cache cleared on restart), no pagination (return full result sets), skip incomplete rules  
**Scale/Scope**: ~779 Rector rules, HTTP scraping/parsing required (no official JSON API available)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Constitution file is template-only with no project-specific principles defined yet. This feature establishes the foundation for the MCP Rector server, so no violations to evaluate at this stage.

### Assumed Best Practices (to be formalized in constitution)
- ✅ **Test-First Development**: Will require test framework setup (Phase 0 research)
- ✅ **MCP Protocol Compliance**: Using official @modelcontextprotocol/sdk
- ✅ **Type Safety**: TypeScript strict mode enabled in tsconfig.json
- ✅ **Error Handling**: MCP structured error responses required per AGENTS.md
- ✅ **Input Validation**: Zod schemas for tool arguments (already in dependencies)

### Post-Design Re-evaluation
*To be completed after Phase 1 design*

## Project Structure

### Documentation (this feature)

```text
specs/001-list-rector-rules/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── list-rules.json      # MCP tool schema for listing all rules
│   ├── filter-rules.json    # MCP tool schema for filtering by rule set
│   └── search-rules.json    # MCP tool schema for keyword search
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── index.ts                 # MCP server entry point (exists, needs tool registration)
├── models/
│   ├── rule.ts             # Rule and RuleSet type definitions
│   └── cache.ts            # In-memory cache manager
├── services/
│   ├── rector-fetcher.ts   # HTTP client to fetch rules from getrector.com
│   ├── rule-parser.ts      # Parse HTML/data into Rule objects
│   └── rule-filter.ts      # Filter and search logic
└── tools/
    ├── list-rules.ts       # MCP tool: list all rules
    ├── filter-rules.ts     # MCP tool: filter by rule set
    └── search-rules.ts     # MCP tool: search by keyword

tests/
├── unit/
│   ├── rule-parser.test.ts
│   ├── rule-filter.test.ts
│   └── cache.test.ts
├── integration/
│   ├── rector-fetcher.test.ts
│   └── tools.test.ts
└── fixtures/
    └── mock-rector-data.json  # Sample rule data for testing

build/                       # TypeScript output (gitignored)
```

**Structure Decision**: Single project structure selected. This is an MCP server with no frontend/backend split. All functionality is exposed via MCP tools following the existing pattern in src/index.ts. Tests organized by type (unit vs integration) with fixtures for mock data to avoid network calls during testing.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. This feature follows MCP best practices and TypeScript conventions documented in AGENTS.md.

---

## Phase 0: Research & Technology Decisions

### Research Tasks

1. **NEEDS CLARIFICATION**: Testing framework
   - Investigate: Node.js built-in test runner vs Jest vs Vitest
   - Criteria: TypeScript/ESM support, MCP SDK compatibility, minimal setup
   - Output: Selected framework + package.json test scripts

2. **NEEDS CLARIFICATION**: HTTP client choice
   - Investigate: Native fetch (Node 18+) vs node-fetch vs undici vs axios
   - Criteria: ESM compatibility, TypeScript types, error handling
   - Output: Selected HTTP library + error handling patterns

3. **NEEDS CLARIFICATION**: Rector data source structure
   - Investigate: https://getrector.com/find-rule page structure
   - Criteria: API endpoint vs HTML scraping, data format, stability
   - Output: Scraping strategy or API endpoint documentation

4. **Best practices**: MCP tool design patterns
   - Investigate: @modelcontextprotocol/sdk tool registration patterns
   - Criteria: Zod schema validation, error responses, result formatting
   - Output: Tool handler template + error handling strategy

5. **Best practices**: In-memory caching patterns
   - Investigate: Map vs Object, cache invalidation strategies
   - Criteria: Performance, memory usage, TypeScript type safety
   - Output: Cache interface design + TTL strategy (if needed)

### Deliverable: research.md

Document all decisions with:
- **Decision**: Selected technology/approach
- **Rationale**: Why chosen (performance, compatibility, maintainability)
- **Alternatives Considered**: What was evaluated and rejected
- **Implementation Notes**: Key patterns, gotchas, examples

---

## Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

### 1. Data Model Design (data-model.md)

Extract from spec.md Key Entities section:

#### Rule Entity
```typescript
interface Rule {
  id: string;              // Unique identifier (e.g., rule class name)
  name: string;            // Human-readable name (required, validated)
  description: string;     // What the rule does (required, validated)
  ruleSet: string;         // Category/set name (required, validated)
  status?: 'stable' | 'deprecated' | 'experimental';  // Optional metadata
  tags?: string[];         // Optional keywords for search
}
```

**Validation Rules** (from FR-014):
- MUST have non-empty name, description, and ruleSet
- Rules with missing required fields are excluded from results

#### RuleSet Entity
```typescript
interface RuleSet {
  name: string;            // Set identifier (e.g., "PHP80", "Symfony")
  displayName: string;     // Human-readable name
  description?: string;    // Optional description
  ruleCount: number;       // Computed from rules in this set
}
```

#### Cache State
```typescript
interface CacheState {
  rules: Rule[];           // All fetched rules (after validation)
  ruleSets: RuleSet[];     // Derived from rules
  lastFetched: Date;       // Timestamp for diagnostics
  fetchStatus: 'empty' | 'loading' | 'loaded' | 'error';
}
```

### 2. API Contracts (contracts/)

Generate MCP tool schemas from functional requirements:

#### Tool 1: list-rules (FR-001, FR-002, FR-008, FR-009)
```json
{
  "name": "list-rules",
  "description": "List all available Rector rules with metadata",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "rules": {
        "type": "array",
        "items": { "$ref": "#/definitions/Rule" }
      },
      "totalCount": { "type": "number" },
      "ruleSets": {
        "type": "array",
        "items": { "$ref": "#/definitions/RuleSet" }
      }
    }
  }
}
```

#### Tool 2: filter-rules (FR-004, FR-003)
```json
{
  "name": "filter-rules",
  "description": "Filter Rector rules by rule set or category",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ruleSet": {
        "type": "string",
        "description": "Rule set name to filter by (e.g., 'PHP80', 'Symfony')"
      }
    },
    "required": ["ruleSet"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "rules": {
        "type": "array",
        "items": { "$ref": "#/definitions/Rule" }
      },
      "matchedCount": { "type": "number" },
      "ruleSet": { "$ref": "#/definitions/RuleSet" }
    }
  }
}
```

#### Tool 3: search-rules (FR-005)
```json
{
  "name": "search-rules",
  "description": "Search Rector rules by keyword in names and descriptions",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Keyword to search for in rule names and descriptions",
        "minLength": 1
      },
      "ruleSet": {
        "type": "string",
        "description": "Optional: filter results to specific rule set"
      }
    },
    "required": ["query"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "rules": {
        "type": "array",
        "items": { "$ref": "#/definitions/Rule" }
      },
      "matchedCount": { "type": "number" },
      "query": { "type": "string" }
    }
  }
}
```

### 3. Quickstart Guide (quickstart.md)

Create developer onboarding document with:
- How to install and run the MCP server
- Example MCP client interactions for each tool
- Common use cases (browse, filter PHP 8.0 rules, search "array")
- Troubleshooting (cache behavior, network errors)

### 4. Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh opencode` to add:
- Selected HTTP client library
- Selected test framework
- MCP tool naming conventions
- Rector rule metadata handling patterns

---

## Phase 2: Task Breakdown

**Prerequisites:** Phase 1 complete, user approval of design

*This section is NOT filled by `/speckit.plan`. Run `/speckit.tasks` after Phase 1 approval to generate tasks.md with TDD implementation steps.*

---

## Next Steps

1. ✅ Review this implementation plan
2. ⏳ Execute Phase 0 research tasks (auto-generated in next step)
3. ⏳ Generate Phase 1 deliverables (data-model.md, contracts/, quickstart.md)
4. ⏳ Update AGENTS.md with technology decisions
5. ⏳ Re-evaluate constitution compliance
6. ⏳ Get user approval before proceeding to `/speckit.tasks`

**Ready to proceed with Phase 0 research?**
