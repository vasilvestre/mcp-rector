import { z } from 'zod';
import { rectorCache } from '../models/cache.js';
import { searchRules } from '../services/rule-filter.js';

/**
 * Input schema for search-rector-rules tool
 */
export const searchRulesInputSchema = z.object({
  query: z.string().min(1),
  ruleSet: z.string().optional()
});

/**
 * Output schema for search-rector-rules tool
 */
export const searchRulesOutputSchema = z.object({
  rules: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    ruleSet: z.string(),
    classPath: z.string().optional(),
    status: z.enum(['stable', 'deprecated', 'experimental']).optional(),
    configurable: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    relevance: z.enum(['name', 'description', 'tag'])
  })),
  matchedCount: z.number(),
  query: z.string(),
  filteredRuleSet: z.string().nullable().optional(),
  cacheStatus: z.enum(['fresh', 'stale', 'error'])
});

/**
 * MCP tool handler for searching Rector rules by keyword
 * Searches in rule name, description, and tags with optional rule set filter
 * @param args - Search parameters including query and optional ruleSet filter
 * @returns MCP tool response with matching rules sorted by relevance or error
 */
export async function searchRulesHandler(args: z.infer<typeof searchRulesInputSchema>) {
  try {
    const { query, ruleSet } = args;
    
    if (query.trim().length === 0) {
      return {
        content: [{ 
          type: 'text' as const, 
          text: 'Error: Query string cannot be empty' 
        }],
        isError: true
      };
    }
    
    const allRules = await rectorCache.getRules();
    const searchResults = searchRules(allRules, query, ruleSet);
    const cacheStatus = rectorCache.getStatus();
    
    const output = {
      rules: searchResults,
      matchedCount: searchResults.length,
      query,
      filteredRuleSet: ruleSet || null,
      cacheStatus: cacheStatus === 'loaded' ? 'fresh' as const : 
                   cacheStatus === 'error' ? 'error' as const : 'stale' as const
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
      isError: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error searching Rector rules: ${errorMessage}` 
      }],
      isError: true
    };
  }
}
