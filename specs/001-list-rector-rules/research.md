# Research: List Available Rector Rules

**Date**: 2025-10-23  
**Feature**: 001-list-rector-rules  
**Phase**: 0 (Technology Selection & Feasibility)

This document resolves all "NEEDS CLARIFICATION" items from the implementation plan and establishes technology decisions with supporting rationale.

---

## 1. Testing Framework Selection

### Decision: Node.js Built-in Test Runner

**Selected**: Node.js built-in `node:test` module (available since Node 18+)

### Rationale
1. **Zero dependencies**: No additional packages required, aligns with minimal dependency principle
2. **ESM native**: First-class ES modules support, matches tsconfig.json module: "Node16"
3. **TypeScript compatibility**: Works seamlessly with `tsx` or direct `tsc` compilation
4. **Sufficient features**: Provides `describe`, `it`, `beforeEach`, assertions, mocking
5. **Future-proof**: Official Node.js solution with active development

### Alternatives Considered

| Framework | Pros | Cons | Rejection Reason |
|-----------|------|------|------------------|
| **Jest** | Mature, popular, extensive ecosystem | Poor ESM support, heavy setup, requires transformers | ESM friction, maintenance overhead |
| **Vitest** | Fast, modern, ESM native, Jest-compatible API | Additional dependency, overkill for simple MCP server | Unnecessary complexity for project scope |
| **tsx** | Direct TypeScript execution | Not a test framework (test runner only) | Would still need test framework |

### Implementation Notes
```json
// package.json scripts addition
{
  "scripts": {
    "test": "node --test build/**/*.test.js",
    "test:watch": "node --test --watch build/**/*.test.js",
    "test:coverage": "node --test --experimental-test-coverage build/**/*.test.js"
  }
}
```

**Testing workflow**:
1. Write tests in TypeScript (`.test.ts` files)
2. Run `npm run build` to compile TypeScript
3. Execute `npm test` to run compiled tests
4. For development: use `tsc --watch` + `npm run test:watch`

**Key imports**:
```typescript
import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
```

---

## 2. HTTP Client Selection

### Decision: Native `fetch` (Node.js 18+)

**Selected**: Built-in `globalThis.fetch` API (stable since Node 18.0.0, no experimental flag since 21.0.0)

### Rationale
1. **Zero dependencies**: No external packages needed
2. **Web standard API**: Same API as browsers, familiar to developers
3. **TypeScript support**: Built-in types via `@types/node` (already in project)
4. **ESM compatible**: Native ES module, no CJS/ESM issues
5. **Sufficient features**: Supports headers, error handling, timeout via AbortController
6. **Performance**: Built on undici (fast HTTP/1.1 client) under the hood

### Alternatives Considered

| Library | Pros | Cons | Rejection Reason |
|---------|------|------|------------------|
| **node-fetch** | Polyfills fetch for older Node | Extra dependency, redundant on Node 18+ | Native fetch available |
| **undici** | Very fast, Node.js core team maintained | Lower-level API, less familiar | Fetch is simpler, sufficient |
| **axios** | Popular, extensive features, interceptors | Heavy, CJS-first, potential ESM issues | Overkill, potential module issues |
| **got** | Modern, promise-based, retry logic | Extra dependency, more features than needed | Native fetch sufficient |

### Implementation Notes

**Basic fetch with timeout**:
```typescript
async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'mcp-rector/1.0' }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Error handling pattern**:
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  return text;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  throw new Error(`Fetch failed: ${error.message}`);
}
```

---

## 3. Rector Data Source Structure

### Decision: Fetch Markdown from GitHub, Parse Locally

**Selected**: Fetch `rector_rules_overview.md` from GitHub `rectorphp/rector` repository

**Source URL**: `https://raw.githubusercontent.com/rectorphp/rector/main/docs/rector_rules_overview.md`

### Rationale
1. **Structured format**: Markdown with consistent heading hierarchy
2. **Stable endpoint**: GitHub raw content URL, reliable and fast
3. **Complete data**: Contains 382+ rules with names, descriptions, categories, PHP class paths
4. **No scraping needed**: Plain text format, no HTML parsing required
5. **Parseable structure**: Predictable format with `##` categories, `###` rule names, metadata lines
6. **Offline-friendly**: Can cache entire file (165KB) in memory

### Data Structure Analysis

**File format**:
```markdown
# 382 Rules Overview

## Categories
- [Arguments](#arguments) (4)
- [CodeQuality](#codequality) (69)
...

## Arguments

### ArgumentAdderRector
This Rector adds new default arguments...
:wrench: **configure it!**
- class: [`Rector\Arguments\Rector\ClassMethod\ArgumentAdderRector`](../rules/...)
```

**Parsing strategy**:
1. Split by `## ` (category headers)
2. For each category, split by `### ` (rule headers)
3. Extract rule name (heading text)
4. Extract description (first paragraph after heading)
5. Extract PHP class path from `- class:` line (if present)
6. Extract configurability from `:wrench:` marker (if present)

### Alternatives Considered

| Source | Pros | Cons | Rejection Reason |
|--------|------|------|------------------|
| **getrector.com/find-rule** | Official website, searchable | Requires HTML scraping, Livewire dynamic | Fragile, complex parsing |
| **GitHub API (JSON)** | Structured data | No direct rule list endpoint, would need to traverse files | Indirect, multiple requests |
| **getrector.com API** | If existed, ideal | No public JSON API found | Does not exist |
| **Rector PHP package** | Most authoritative | Requires PHP runtime, not feasible for Node.js MCP | Wrong language runtime |

### Implementation Notes

**Parsing logic outline**:
```typescript
interface RawRule {
  name: string;           // e.g., "ArgumentAdderRector"
  description: string;    // First paragraph text
  category: string;       // e.g., "Arguments"
  classPath?: string;     // e.g., "Rector\\Arguments\\Rector\\..."
  configurable: boolean;  // True if ":wrench:" marker present
}

function parseRectorMarkdown(markdown: string): RawRule[] {
  const rules: RawRule[] = [];
  
  // Split by "## " to get category sections (skip first "# 382 Rules" header)
  const sections = markdown.split(/\n## /).slice(1);
  
  for (const section of sections) {
    const lines = section.split('\n');
    const category = lines[0].trim();
    
    // Skip "Categories" section
    if (category === 'Categories') continue;
    
    // Split by "### " to get individual rules
    const ruleTexts = section.split(/\n### /).slice(1);
    
    for (const ruleText of ruleTexts) {
      const ruleLines = ruleText.split('\n');
      const name = ruleLines[0].trim();
      
      // Extract description (first non-empty line after name)
      let description = '';
      let classPath: string | undefined;
      let configurable = false;
      
      for (let i = 1; i < ruleLines.length; i++) {
        const line = ruleLines[i].trim();
        
        if (!description && line && !line.startsWith(':') && !line.startsWith('-')) {
          description = line;
        }
        
        if (line.includes(':wrench:')) {
          configurable = true;
        }
        
        if (line.startsWith('- class:')) {
          // Extract class path from markdown link: [`ClassName`](path)
          const match = line.match(/\[`([^`]+)`\]/);
          if (match) classPath = match[1];
        }
        
        // Stop at code block or next section
        if (line.startsWith('```') || line.startsWith('##')) break;
      }
      
      // Validate required fields (FR-014: skip incomplete rules)
      if (name && description) {
        rules.push({ name, description, category, classPath, configurable });
      }
    }
  }
  
  return rules;
}
```

**Validation & Data Quality**:
- **Required fields**: `name`, `description`, `category` (matches FR-014)
- **Optional fields**: `classPath`, `configurable`, `tags`
- **Skip rules** missing required fields (ensures data quality per clarification #5)
- **Expected rule count**: ~382 rules across ~30 categories (as of 2025-10-23)

**Fallback handling** (per clarification #4):
- Primary: Fetch from GitHub on first tool call
- Cache: Store parsed rules in memory for session
- Fallback: If GitHub fetch fails, return cached data (if available)
- Error: If no cache and fetch fails, return structured MCP error

---

## 4. MCP Tool Design Patterns

### Decision: Use `server.registerTool()` with Zod Schemas

**Selected**: High-level `McpServer.registerTool()` API from `@modelcontextprotocol/sdk`

### Rationale
1. **Type-safe**: Zod schemas provide runtime validation + TypeScript inference
2. **Automatic validation**: SDK validates inputs before handler execution
3. **Structured errors**: SDK handles error responses automatically
4. **Best practice**: Official SDK documentation recommends this approach
5. **Already available**: Project has `zod ^3.25.76` in dependencies

### Implementation Pattern

**Tool registration template**:
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Define input/output schemas
const inputSchema = {
  query: z.string().min(1).describe('Search keyword'),
  ruleSet: z.string().optional().describe('Optional rule set filter')
};

const outputSchema = {
  rules: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    ruleSet: z.string(),
    status: z.enum(['stable', 'deprecated', 'experimental']).optional()
  })),
  matchedCount: z.number(),
  query: z.string()
};

// Register tool with handler
server.registerTool(
  'search-rules',
  {
    title: 'Search Rector Rules',
    description: 'Search Rector rules by keyword in names and descriptions',
    inputSchema,
    outputSchema
  },
  async ({ query, ruleSet }) => {
    // Business logic here
    const rules = await searchRules(query, ruleSet);
    const output = { rules, matchedCount: rules.length, query };
    
    return {
      content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      structuredContent: output
    };
  }
);
```

**Error handling pattern** (per AGENTS.md):
```typescript
async ({ query }) => {
  try {
    const rules = await getRules();
    // ... business logic
    return { content: [...], structuredContent: output };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `Error: ${error.message}` 
      }],
      isError: true
    };
  }
}
```

### Key Learnings from SDK Documentation

1. **Tool lifecycle**: Tools can be dynamically enabled/disabled/updated via `tool.enable()`, `tool.disable()`, `tool.update()`
2. **Notifications**: SDK automatically sends `tools/list_changed` when tools are modified
3. **Return format**: Always return `{ content: ContentItem[], structuredContent?: object }`
4. **Content types**: Use `type: 'text'` for formatted output, `type: 'resource_link'` for external references
5. **Transport**: Use `StdioServerTransport` for MCP stdio protocol (already in src/index.ts pattern)

---

## 5. In-Memory Caching Strategy

### Decision: TypeScript Map with Lazy Initialization

**Selected**: `Map<string, T>` with singleton cache manager class

### Rationale
1. **Type-safe**: Map generic types provide compile-time safety
2. **Performance**: O(1) lookups, efficient for ~400 rules
3. **Memory**: ~165KB markdown + ~100KB parsed objects = acceptable for session cache
4. **Simple**: No TTL/eviction needed (session-scoped per clarification #3)
5. **Testable**: Easy to mock for unit tests

### Implementation Pattern

**Cache manager class**:
```typescript
interface CachedData {
  rules: Rule[];
  ruleSets: RuleSet[];
  lastFetched: Date;
}

class RectorCache {
  private cache: CachedData | null = null;
  private fetchPromise: Promise<CachedData> | null = null;
  
  async getRules(): Promise<Rule[]> {
    if (this.cache) {
      return this.cache.rules;
    }
    return (await this.ensureLoaded()).rules;
  }
  
  async getRuleSets(): Promise<RuleSet[]> {
    if (this.cache) {
      return this.cache.ruleSets;
    }
    return (await this.ensureLoaded()).ruleSets;
  }
  
  private async ensureLoaded(): Promise<CachedData> {
    // Prevent duplicate fetches via promise caching
    if (this.fetchPromise) {
      return this.fetchPromise;
    }
    
    this.fetchPromise = this.loadData();
    try {
      this.cache = await this.fetchPromise;
      return this.cache;
    } finally {
      this.fetchPromise = null;
    }
  }
  
  private async loadData(): Promise<CachedData> {
    const markdown = await fetchRectorMarkdown();
    const rawRules = parseRectorMarkdown(markdown);
    
    // Transform to domain models
    const rules = rawRules.map(transformToRule);
    const ruleSets = deriveRuleSets(rules);
    
    return {
      rules,
      ruleSets,
      lastFetched: new Date()
    };
  }
  
  isLoaded(): boolean {
    return this.cache !== null;
  }
  
  clear(): void {
    this.cache = null;
    this.fetchPromise = null;
  }
}

// Singleton instance
export const rectorCache = new RectorCache();
```

**Usage in tools**:
```typescript
server.registerTool('list-rules', { ... }, async () => {
  try {
    const rules = await rectorCache.getRules();
    const ruleSets = await rectorCache.getRuleSets();
    
    return {
      content: [{ type: 'text', text: JSON.stringify({ rules, ruleSets }) }],
      structuredContent: { rules, ruleSets, totalCount: rules.length }
    };
  } catch (error) {
    // Fallback: if cache load fails and no cached data, return error
    return {
      content: [{ type: 'text', text: `Failed to fetch rules: ${error.message}` }],
      isError: true
    };
  }
});
```

### Alternatives Considered

| Approach | Pros | Cons | Rejection Reason |
|----------|------|------|------------------|
| **Plain object `{}`** | Simplest | No type safety, slower lookups | Map is better |
| **LRU cache library** | Eviction policies, TTL | Extra dependency, overkill | Not needed for session cache |
| **Redis/external cache** | Persistent, shared across instances | Requires infrastructure, complexity | Violates in-memory requirement |
| **File system cache** | Survives restarts | Disk I/O, complexity, violates session scope | Against clarification #3 |

### Cache Invalidation

**Per clarification #3**: Cache persists for server session lifetime, cleared on restart.

**Manual refresh** (optional enhancement):
```typescript
// Could add a tool to force cache refresh if needed
server.registerTool('refresh-rules', { ... }, async () => {
  rectorCache.clear();
  const rules = await rectorCache.getRules();
  return { ... };
});
```

---

## 6. Derived Entities & Transformations

### RuleSet Derivation

**Problem**: GitHub markdown doesn't have explicit RuleSet objects, only category names.

**Solution**: Derive RuleSets from rules by grouping by category.

```typescript
function deriveRuleSets(rules: Rule[]): RuleSet[] {
  const setMap = new Map<string, RuleSet>();
  
  for (const rule of rules) {
    if (!setMap.has(rule.ruleSet)) {
      setMap.set(rule.ruleSet, {
        name: rule.ruleSet,
        displayName: formatCategoryName(rule.ruleSet),
        ruleCount: 0
      });
    }
    
    const ruleSet = setMap.get(rule.ruleSet)!;
    ruleSet.ruleCount++;
  }
  
  return Array.from(setMap.values()).sort((a, b) => 
    a.displayName.localeCompare(b.displayName)
  );
}

function formatCategoryName(category: string): string {
  // "CodeQuality" -> "Code Quality"
  // "Php80" -> "PHP 8.0"
  // "DeadCode" -> "Dead Code"
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^Php(\d+)/, 'PHP $1')
    .trim();
}
```

---

## Summary of Decisions

| Concern | Decision | Key Benefit |
|---------|----------|-------------|
| **Testing** | Node.js `node:test` | Zero dependencies, ESM native |
| **HTTP Client** | Native `fetch` | Zero dependencies, web standard |
| **Data Source** | GitHub markdown file | Stable, parseable, complete |
| **MCP Pattern** | `server.registerTool()` | Type-safe, validated, official |
| **Caching** | `Map` with singleton class | Simple, performant, testable |

**Next phase**: Generate data models, API contracts, and quickstart guide based on these decisions.
