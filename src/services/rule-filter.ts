import { Rule, RuleSet } from '../models/rule.js';

type Relevance = 'name' | 'description' | 'tag';

/**
 * Extends Rule with relevance scoring for search results
 */
export interface RuleWithRelevance extends Rule {
  relevance: Relevance;
}

/**
 * Normalizes rule set name for case-insensitive comparison
 * Converts to lowercase and replaces spaces/underscores with hyphens
 * @param name - Raw rule set name
 * @returns Normalized name
 */
function normalizeRuleSetName(name: string): string {
  return name.toLowerCase().replace(/[_\s]+/g, '-');
}

/**
 * Filters rules by rule set using case-insensitive normalized matching
 * @param rules - All available rules
 * @param ruleSetQuery - Rule set name to filter by
 * @returns Rules matching the specified rule set
 */
export function filterRulesByRuleSet(rules: Rule[], ruleSetQuery: string): Rule[] {
  const normalizedQuery = normalizeRuleSetName(ruleSetQuery);
  
  return rules.filter(rule => {
    const normalizedRuleSet = normalizeRuleSetName(rule.ruleSet);
    return normalizedRuleSet === normalizedQuery;
  });
}

/**
 * Extracts rule set metadata from filtered rules
 * @param rules - Filtered rules belonging to the same rule set
 * @param ruleSetName - Name of the rule set
 * @returns RuleSet metadata or null if no rules provided
 */
export function extractRuleSetMetadata(rules: Rule[], ruleSetName: string): RuleSet | null {
  if (rules.length === 0) {
    return null;
  }
  
  const firstRule = rules[0];
  const ruleSet = firstRule.ruleSet;
  
  return {
    name: normalizeRuleSetName(ruleSet),
    displayName: ruleSet,
    description: `Rules for ${ruleSet}`,
    ruleCount: rules.length
  };
}

/**
 * Case-insensitive partial text matching
 * @param text - Text to search within
 * @param query - Search query
 * @returns True if query found in text
 */
function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Searches rules by keyword with optional rule set filter
 * Searches in name, description, and tags with relevance scoring
 * Results are sorted by relevance: name matches first, then description, then tags
 * @param rules - All available rules
 * @param query - Search keyword
 * @param ruleSetFilter - Optional rule set to filter by first
 * @returns Matching rules with relevance scores, sorted by relevance
 */
export function searchRules(
  rules: Rule[], 
  query: string, 
  ruleSetFilter?: string
): RuleWithRelevance[] {
  let rulesToSearch = rules;
  
  if (ruleSetFilter) {
    rulesToSearch = filterRulesByRuleSet(rules, ruleSetFilter);
  }
  
  const results: RuleWithRelevance[] = [];
  
  for (const rule of rulesToSearch) {
    let relevance: Relevance | null = null;
    
    if (matchesQuery(rule.name, query)) {
      relevance = 'name';
    } else if (matchesQuery(rule.description, query)) {
      relevance = 'description';
    } else if (rule.tags?.some(tag => matchesQuery(tag, query))) {
      relevance = 'tag';
    }
    
    if (relevance) {
      results.push({
        ...rule,
        relevance
      });
    }
  }
  
  results.sort((a, b) => {
    const relevanceOrder = { name: 0, description: 1, tag: 2 };
    return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
  });
  
  return results;
}
