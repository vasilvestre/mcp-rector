import { z } from 'zod';
import { rectorCache } from '../models/cache.js';

/**
 * Input schema for list-rector-rules tool (no parameters required)
 */
export const listRulesInputSchema = z.object({});

/**
 * Output schema for list-rector-rules tool
 */
export const listRulesOutputSchema = z.object({
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
  totalCount: z.number(),
  ruleSets: z.array(z.object({
    name: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    ruleCount: z.number()
  })),
  cacheStatus: z.enum(['empty', 'loading', 'loaded', 'error']),
  lastUpdated: z.string()
});

/**
 * MCP tool handler for listing all Rector rules
 * Returns all rules with metadata, rule sets, and cache status
 * @returns MCP tool response with rules data or error
 */
export async function listRulesHandler() {
  try {
    const rules = await rectorCache.getRules();
    const ruleSets = await rectorCache.getRuleSets();
    const cacheStatus = rectorCache.getStatus();

    const output = {
      rules,
      totalCount: rules.length,
      ruleSets,
      cacheStatus,
      lastUpdated: new Date().toISOString()
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
        text: `Error loading Rector rules: ${errorMessage}` 
      }],
      isError: true
    };
  }
}
