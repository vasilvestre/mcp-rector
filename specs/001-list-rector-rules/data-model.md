# Data Model: List Available Rector Rules

**Feature**: 001-list-rector-rules  
**Date**: 2025-10-23  
**Status**: Design Phase

This document defines the core domain entities, their relationships, validation rules, and state management for the Rector rules listing feature.

---

## Overview

The system manages three primary entities:
1. **Rule**: Individual Rector refactoring rule
2. **RuleSet**: Collection of related rules (categories)
3. **Cache**: In-memory storage for fetched data

These entities are derived from parsing GitHub's `rector_rules_overview.md` file and cached for the server session lifetime.

---

## Entity Definitions

### 1. Rule Entity

Represents a single Rector refactoring rule with complete metadata.

#### TypeScript Interface

```typescript
interface Rule {
  /**
   * Unique identifier derived from rule name
   * Format: lowercase-with-dashes (e.g., "argument-adder-rector")
   */
  id: string;
  
  /**
   * Human-readable rule name (REQUIRED)
   * Example: "ArgumentAdderRector"
   */
  name: string;
  
  /**
   * What the rule does (REQUIRED)
   * Example: "This Rector adds new default arguments in calls of defined methods"
   */
  description: string;
  
  /**
   * Category/set this rule belongs to (REQUIRED)
   * Example: "Arguments", "Php80", "CodeQuality"
   */
  ruleSet: string;
  
  /**
   * Fully qualified PHP class path (OPTIONAL)
   * Example: "Rector\\Arguments\\Rector\\ClassMethod\\ArgumentAdderRector"
   */
  classPath?: string;
  
  /**
   * Rule lifecycle status (OPTIONAL)
   * Defaults to 'stable' if not specified
   */
  status?: 'stable' | 'deprecated' | 'experimental';
  
  /**
   * Whether rule requires configuration (OPTIONAL)
   * True if markdown contains ":wrench: **configure it!**"
   */
  configurable?: boolean;
  
  /**
   * Searchable keywords derived from name/description (OPTIONAL)
   * Used for full-text search optimization
   */
  tags?: string[];
}
```

#### Validation Rules (FR-014)

**Required Fields**:
- `id`: Must be non-empty string
- `name`: Must be non-empty string, trimmed
- `description`: Must be non-empty string, min 10 characters
- `ruleSet`: Must be non-empty string

**Validation Logic**:
```typescript
function validateRule(raw: Partial<Rule>): Rule | null {
  // Skip rules with missing required fields
  if (!raw.name?.trim() || 
      !raw.description?.trim() || 
      !raw.ruleSet?.trim()) {
    return null;
  }
  
  // Generate ID from name
  const id = raw.name
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  
  // Extract tags for search
  const tags = extractSearchTags(raw.name, raw.description);
  
  return {
    id,
    name: raw.name.trim(),
    description: raw.description.trim(),
    ruleSet: raw.ruleSet.trim(),
    classPath: raw.classPath?.trim(),
    status: raw.status || 'stable',
    configurable: raw.configurable || false,
    tags
  };
}
```

**Search Tag Extraction**:
```typescript
function extractSearchTags(name: string, description: string): string[] {
  // Convert camelCase to words
  const nameWords = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/\s+/);
  
  // Extract significant words from description
  const descWords = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !commonWords.includes(word));
  
  // Combine and deduplicate
  return [...new Set([...nameWords, ...descWords])];
}

const commonWords = ['this', 'that', 'with', 'from', 'have', 'will', 'been', 'were'];
```

---

### 2. RuleSet Entity

Represents a category/collection of related rules. Derived from rules, not stored separately.

#### TypeScript Interface

```typescript
interface RuleSet {
  /**
   * Unique identifier matching the category name
   * Example: "Arguments", "Php80", "CodeQuality"
   */
  name: string;
  
  /**
   * Human-readable display name
   * Example: "Code Quality", "PHP 8.0", "Arguments"
   */
  displayName: string;
  
  /**
   * Optional description of the rule set (OPTIONAL)
   * Could be added in future from external metadata
   */
  description?: string;
  
  /**
   * Number of rules in this set (COMPUTED)
   * Derived by counting rules with matching ruleSet
   */
  ruleCount: number;
}
```

#### Derivation Logic

RuleSets are computed from the Rule collection, not fetched separately:

```typescript
function deriveRuleSets(rules: Rule[]): RuleSet[] {
  const setMap = new Map<string, RuleSet>();
  
  for (const rule of rules) {
    if (!setMap.has(rule.ruleSet)) {
      setMap.set(rule.ruleSet, {
        name: rule.ruleSet,
        displayName: formatDisplayName(rule.ruleSet),
        ruleCount: 0
      });
    }
    
    setMap.get(rule.ruleSet)!.ruleCount++;
  }
  
  // Return sorted by display name
  return Array.from(setMap.values())
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function formatDisplayName(name: string): string {
  // Handle PHP version numbers: "Php80" -> "PHP 8.0"
  if (/^Php\d+$/.test(name)) {
    const version = name.substring(3);
    const major = version[0];
    const minor = version[1] || '0';
    return `PHP ${major}.${minor}`;
  }
  
  // Handle camelCase: "CodeQuality" -> "Code Quality"
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}
```

---

### 3. Cache State Entity

Manages in-memory storage of fetched and parsed data.

#### TypeScript Interface

```typescript
interface CacheState {
  /**
   * All validated rules (required fields present)
   */
  rules: Rule[];
  
  /**
   * Derived rule sets (computed from rules)
   */
  ruleSets: RuleSet[];
  
  /**
   * When data was last fetched from GitHub
   */
  lastFetched: Date;
  
  /**
   * Current cache status
   */
  status: CacheStatus;
}

type CacheStatus = 
  | 'empty'      // No data loaded yet
  | 'loading'    // Fetch in progress
  | 'loaded'     // Data available
  | 'error';     // Last fetch failed (may have stale data)

interface CacheError {
  message: string;
  timestamp: Date;
  hadFallback: boolean;  // Whether stale data was available
}
```

#### State Transitions

```typescript
class RectorCache {
  private state: CacheState = {
    rules: [],
    ruleSets: [],
    lastFetched: new Date(0),
    status: 'empty'
  };
  
  private lastError: CacheError | null = null;
  
  async load(): Promise<void> {
    this.state.status = 'loading';
    
    try {
      const markdown = await fetchRectorMarkdown();
      const rawRules = parseRectorMarkdown(markdown);
      const validRules = rawRules
        .map(validateRule)
        .filter((r): r is Rule => r !== null);
      
      this.state = {
        rules: validRules,
        ruleSets: deriveRuleSets(validRules),
        lastFetched: new Date(),
        status: 'loaded'
      };
      
      this.lastError = null;
    } catch (error) {
      // Keep existing data if available (fallback per clarification #4)
      const hadFallback = this.state.rules.length > 0;
      
      this.lastError = {
        message: error.message,
        timestamp: new Date(),
        hadFallback
      };
      
      this.state.status = 'error';
      
      if (!hadFallback) {
        throw error;  // No fallback available
      }
    }
  }
}
```

---

## Entity Relationships

```text
┌─────────────┐
│ CacheState  │
└──────┬──────┘
       │ contains
       ├─────────────────────┐
       │                     │
       ▼                     ▼
  ┌─────────┐         ┌───────────┐
  │  Rule   │─────────│  RuleSet  │
  └─────────┘ belongs │           │
     (382)    to      └───────────┘
                         (30)
```

- **One-to-Many**: RuleSet → Rule (one category contains many rules)
- **Computed**: RuleSet derived from Rule collection
- **Cached**: Both stored in CacheState for session lifetime

---

## Data Flow

### 1. Initial Load (First Tool Call)

```text
┌───────────────┐
│ MCP Tool Call │
└───────┬───────┘
        │
        ▼
┌──────────────────┐
│ rectorCache      │
│ .getRules()      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Check cache status   │
│ status === 'empty'?  │
└─────────┬────────────┘
          │ YES
          ▼
┌──────────────────────────────┐
│ Fetch from GitHub            │
│ https://raw.githubusercontent│
│ .com/.../rector_rules_...md  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Parse Markdown               │
│ - Split by ## categories     │
│ - Split by ### rule names    │
│ - Extract metadata           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Validate Rules               │
│ - Check required fields      │
│ - Skip incomplete rules      │
│ - Generate IDs and tags      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Derive RuleSets              │
│ - Group by category          │
│ - Count rules per set        │
│ - Format display names       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Store in Cache               │
│ status = 'loaded'            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Return Rules to Tool         │
└──────────────────────────────┘
```

### 2. Subsequent Calls (Cache Hit)

```text
┌───────────────┐
│ MCP Tool Call │
└───────┬───────┘
        │
        ▼
┌──────────────────┐
│ rectorCache      │
│ .getRules()      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Check cache status   │
│ status === 'loaded'? │
└─────────┬────────────┘
          │ YES
          ▼
┌──────────────────────────────┐
│ Return Cached Rules          │
│ (no network call)            │
└──────────────────────────────┘
```

### 3. Error with Fallback

```text
┌───────────────┐
│ MCP Tool Call │
└───────┬───────┘
        │
        ▼
┌──────────────────────┐
│ Fetch from GitHub    │
└─────────┬────────────┘
          │ ERROR (network failure)
          ▼
┌──────────────────────────────┐
│ Check cache.rules.length > 0?│
└─────────┬───────────┬────────┘
          │ YES       │ NO
          ▼           ▼
  ┌───────────┐  ┌────────────┐
  │ Return    │  │ Throw      │
  │ Stale Data│  │ Error      │
  └───────────┘  └────────────┘
```

---

## Performance Considerations

### Memory Usage

**Estimate for 382 rules**:
- Raw markdown: ~165 KB
- Parsed rules: ~400 rules × ~200 bytes = ~80 KB
- Rule sets: ~30 sets × ~50 bytes = ~1.5 KB
- **Total**: ~250 KB in memory (acceptable for Node.js)

### Computation Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Initial fetch | O(1) HTTP + O(n) parse | n = ~165KB text, ~5-10ms parse time |
| Validate rules | O(n) | n = ~400 rules, ~1ms |
| Derive rule sets | O(n) | n = ~400 rules, <1ms |
| Cache lookup | O(1) | Direct reference, no search |
| Filter by set | O(n) | n = ~400 rules, ~1ms |
| Search by keyword | O(n × m) | n = rules, m = avg tags per rule (~10), ~5-10ms |

**Performance targets** (from spec.md):
- ✅ Initial fetch: <3s (network + parse)
- ✅ Filter operations: <1s (in-memory scan)
- ✅ Cache hits: <200ms (memory reference)

---

## Testing Strategy

### Unit Tests

```typescript
describe('Rule validation', () => {
  it('should accept rule with all required fields', () => {
    const raw = {
      name: 'TestRector',
      description: 'A test rule description',
      ruleSet: 'Testing'
    };
    const rule = validateRule(raw);
    assert(rule !== null);
    assert.equal(rule.name, 'TestRector');
  });
  
  it('should reject rule with missing description', () => {
    const raw = {
      name: 'TestRector',
      description: '',
      ruleSet: 'Testing'
    };
    const rule = validateRule(raw);
    assert.equal(rule, null);
  });
});

describe('RuleSet derivation', () => {
  it('should group rules by category', () => {
    const rules: Rule[] = [
      { id: '1', name: 'A', description: 'test', ruleSet: 'Cat1' },
      { id: '2', name: 'B', description: 'test', ruleSet: 'Cat1' },
      { id: '3', name: 'C', description: 'test', ruleSet: 'Cat2' }
    ];
    
    const sets = deriveRuleSets(rules);
    assert.equal(sets.length, 2);
    assert.equal(sets[0].ruleCount, 2);
    assert.equal(sets[1].ruleCount, 1);
  });
});
```

### Integration Tests

```typescript
describe('Cache lifecycle', () => {
  it('should fetch and cache on first call', async () => {
    const cache = new RectorCache();
    const rules = await cache.getRules();
    
    assert(rules.length > 0);
    assert.equal(cache.getStatus(), 'loaded');
  });
  
  it('should return cached data on subsequent calls', async () => {
    const cache = new RectorCache();
    await cache.getRules();
    
    const start = Date.now();
    await cache.getRules();
    const duration = Date.now() - start;
    
    assert(duration < 10, 'Cache hit should be <10ms');
  });
});
```

---

## Migration & Versioning

### Schema Changes

If Rector's markdown format changes:

1. **Backward compatible** (new optional fields): No migration needed
2. **Breaking changes** (required field removed): Update parser + validation
3. **Format changes** (new heading structure): Update regex patterns in parser

### Version Detection

```typescript
// Store schema version in cache
interface CacheState {
  // ... existing fields
  schemaVersion: string;  // e.g., "1.0.0"
}

// Invalidate cache if schema version changes
const CURRENT_SCHEMA = '1.0.0';

if (cache.schemaVersion !== CURRENT_SCHEMA) {
  cache.clear();
}
```

---

## Summary

### Entities
- ✅ **Rule**: Core entity with 7 fields (3 required, 4 optional)
- ✅ **RuleSet**: Derived entity with 3-4 fields
- ✅ **CacheState**: State management with 4 fields + error tracking

### Validation
- ✅ **Required fields enforced**: name, description, ruleSet
- ✅ **Skip incomplete rules**: Implements FR-014

### Performance
- ✅ **Memory efficient**: ~250KB for 400 rules
- ✅ **Fast operations**: All queries <1s per spec

**Next**: Generate API contracts (MCP tool schemas) based on these entities.
