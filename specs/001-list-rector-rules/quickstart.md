# Quickstart Guide: List Rector Rules MCP Server

## Prerequisites

- **Node.js**: v18.0.0 or higher (for native `fetch` API)
- **npm**: v8.0.0 or higher
- **MCP Client**: Claude Desktop, Cline, or any MCP-compatible client

## Installation

```bash
# Clone repository (if not already done)
cd /path/to/mcp-rector

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Running the Server

### Standalone Mode
```bash
node build/index.js
```

### With MCP Client (Claude Desktop)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "rector-rules": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-rector/build/index.js"]
    }
  }
}
```

Restart Claude Desktop to load the server.

## Using the Tools

### 1. List All Rector Rules

**Tool**: `list-rector-rules`

Returns all ~382 Rector rules grouped by rule sets.

**Example Request** (via MCP protocol):
```json
{
  "method": "tools/call",
  "params": {
    "name": "list-rector-rules",
    "arguments": {}
  }
}
```

**Example Response**:
```json
{
  "rules": [
    {
      "id": "php80/AnnotationToAttributeRector",
      "name": "AnnotationToAttributeRector",
      "description": "Converts PHPDoc annotations to PHP 8.0 attributes",
      "ruleSet": "php80",
      "classPath": "Rector\\Php80\\Rector\\Class_\\AnnotationToAttributeRector",
      "status": "stable",
      "configurable": true,
      "tags": ["annotation", "attribute", "php8"]
    }
  ],
  "ruleSets": [
    {
      "name": "php80",
      "displayName": "PHP 8.0",
      "description": "Migration rules for PHP 8.0 features",
      "ruleCount": 42
    }
  ],
  "totalCount": 382,
  "cacheStatus": "fresh",
  "lastUpdated": "2025-10-23T10:30:00Z"
}
```

**Natural Language** (in Claude):
```
"Show me all available Rector rules"
"List all PHP refactoring rules"
"What Rector rules can I use?"
```

---

### 2. Filter Rules by Rule Set

**Tool**: `filter-rector-rules`

Returns all rules for a specific category.

**Example Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "filter-rector-rules",
    "arguments": {
      "ruleSet": "php80"
    }
  }
}
```

**Example Response**:
```json
{
  "rules": [
    {
      "id": "php80/AnnotationToAttributeRector",
      "name": "AnnotationToAttributeRector",
      "description": "Converts PHPDoc annotations to PHP 8.0 attributes",
      "ruleSet": "php80",
      "classPath": "Rector\\Php80\\Rector\\Class_\\AnnotationToAttributeRector",
      "status": "stable",
      "configurable": true,
      "tags": ["annotation", "attribute", "php8"]
    }
  ],
  "matchedCount": 42,
  "ruleSet": {
    "name": "php80",
    "displayName": "PHP 8.0",
    "description": "Migration rules for PHP 8.0 features",
    "ruleCount": 42
  },
  "cacheStatus": "fresh"
}
```

**Natural Language**:
```
"Show me PHP 8.0 rules"
"What rules are in the code-quality set?"
"List all type-declaration rules"
```

**Available Rule Sets**: `php80`, `php81`, `php82`, `code-quality`, `type-declaration`, `dead-code`, `naming`, `arguments`, `privatization`, etc.

---

### 3. Search Rules by Keyword

**Tool**: `search-rector-rules`

Searches rule names, descriptions, and tags with optional rule set filter.

**Example Request** (basic search):
```json
{
  "method": "tools/call",
  "params": {
    "name": "search-rector-rules",
    "arguments": {
      "query": "attribute"
    }
  }
}
```

**Example Request** (search with filter):
```json
{
  "method": "tools/call",
  "params": {
    "name": "search-rector-rules",
    "arguments": {
      "query": "type",
      "ruleSet": "php80"
    }
  }
}
```

**Example Response**:
```json
{
  "rules": [
    {
      "id": "php80/UnionTypesRector",
      "name": "UnionTypesRector",
      "description": "Converts @param/@return union types to native PHP 8.0 union types",
      "ruleSet": "php80",
      "classPath": "Rector\\Php80\\Rector\\FunctionLike\\UnionTypesRector",
      "status": "stable",
      "configurable": false,
      "tags": ["union", "type", "php8"],
      "relevance": "name"
    }
  ],
  "matchedCount": 12,
  "query": "type",
  "filteredRuleSet": "php80",
  "cacheStatus": "fresh"
}
```

**Natural Language**:
```
"Find rules about attributes"
"Search for union type rules in PHP 8.0"
"What rules handle arrays?"
```

---

## Performance Characteristics

- **Initial Load**: ~2-3 seconds (fetches from GitHub)
- **Subsequent Calls**: <100ms (served from in-memory cache)
- **Cache Lifetime**: Session-based (cleared on server restart)
- **Memory Usage**: ~250KB for full rule set
- **Network Fallback**: Returns stale cache if GitHub is unavailable

---

## Troubleshooting

### Server Won't Start

**Error**: `Cannot find module 'build/index.js'`

**Solution**:
```bash
npm run build
```

---

### No Rules Returned

**Error**: `totalCount: 0` or `matchedCount: 0`

**Possible Causes**:
1. **Network Error**: GitHub is unreachable
   - Check internet connection
   - Server logs will show fetch errors
   - Wait 30s for automatic retry

2. **Invalid Filter**: Rule set doesn't exist
   - Use `list-rector-rules` to see available rule sets
   - Rule set names are case-insensitive

3. **No Search Matches**: Query too specific
   - Try broader terms ("type" vs "union type strict")
   - Check spelling

---

### Stale Cache Warning

**Response**: `"cacheStatus": "stale"`

**Meaning**: Data was cached but GitHub fetch failed on background refresh

**Action**: Usually safe to use; data is still valid. If data seems outdated:
```bash
# Restart server to force fresh fetch
killall node
node build/index.js
```

---

### Slow Initial Response

**Symptom**: First `list-rector-rules` call takes 5+ seconds

**Cause**: GitHub API rate limiting or slow network

**Solution**:
- Wait for initial fetch to complete (happens once per session)
- Subsequent calls will be instant
- Consider using `filter-rector-rules` or `search-rector-rules` if you don't need all rules

---

## Development Mode

### Watch Mode (Auto-rebuild)
```bash
npm run watch  # (if script exists)
# OR
npx tsc --watch
```

### View Server Logs
```bash
node build/index.js 2>&1 | tee server.log
```

### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector node build/index.js
```

Open browser to `http://localhost:5173` and interact with tools visually.

---

## Architecture Notes

### Data Flow
1. **Startup**: Server initializes MCP SDK and registers 3 tools
2. **First Call**: Fetches `rector_rules_overview.md` from GitHub
3. **Parsing**: Extracts rules using regex (category → rule name → description → class path)
4. **Caching**: Stores parsed data in TypeScript `Map` singleton
5. **Subsequent Calls**: Served from cache (no network I/O)

### Cache Invalidation
- **Manual**: Restart server
- **Automatic**: None (session-scoped design per SC-003)

### Error Handling
- **Network Errors**: Returns stale cache if available, otherwise empty result
- **Parse Errors**: Skips malformed rules, logs warning
- **Invalid Input**: Returns Zod validation error with specific field details

---

## Next Steps

- **View Full Spec**: See `specs/001-list-rector-rules/` for requirements and design
- **Contribute**: Follow `AGENTS.md` code style guidelines
- **Report Issues**: Use project issue tracker
- **Extend**: Add pagination, advanced filters, or rule configuration examples

---

## Example Session (Claude Desktop)

```
User: "Show me all Rector rules"
Claude: [Calls list-rector-rules, displays 382 rules grouped by 30+ rule sets]

User: "Just the PHP 8.0 rules"
Claude: [Calls filter-rector-rules with ruleSet="php80", shows 42 rules]

User: "Find rules about attributes"
Claude: [Calls search-rector-rules with query="attribute", shows 8 matches]
```

---

**Server Ready!** 🚀 Use any MCP client to interact with Rector rules.
