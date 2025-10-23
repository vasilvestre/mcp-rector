import { z } from 'zod';
import { rectorCache } from '../models/cache.js';
import { filterRulesByRuleSet, extractRuleSetMetadata } from '../services/rule-filter.js';

/**
 * Input schema for filter-rector-rules tool
 */
export const filterRulesInputSchema = z.object({
  ruleSet: z.string().min(1)
});

/**
 * Output schema for filter-rector-rules tool
 */
export const filterRulesOutputSchema = z.object({
  rules: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    ruleSet: z.string(),
    classPath: z.string().optional(),
    status: z.enum(['stable', 'deprecated', 'experimental']).optional(),
    configurable: z.boolean().optional(),
    tags: z.array(z.string()).optional()
  })),
  matchedCount: z.number(),
  ruleSet: z.object({
    name: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    ruleCount: z.number()
  }).optional(),
  cacheStatus: z.enum(['fresh', 'stale', 'error'])
});

/**
 * MCP tool handler for filtering Rector rules by rule set
 * @param args - Filter parameters including ruleSet name
 * @returns MCP tool response with filtered rules or error
 */
export async function filterRulesHandler(args: z.infer<typeof filterRulesInputSchema>) {
  try {
    const { ruleSet } = args;
    const allRules = await rectorCache.getRules();
    
    const filteredRules = filterRulesByRuleSet(allRules, ruleSet);
    const ruleSetMetadata = extractRuleSetMetadata(filteredRules, ruleSet);
    const cacheStatus = rectorCache.getStatus();
    
    const output = {
      rules: filteredRules,
      matchedCount: filteredRules.length,
      ruleSet: ruleSetMetadata,
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
        text: `Error filtering Rector rules: ${errorMessage}` 
      }],
      isError: true
    };
  }
}
