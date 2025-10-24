import { Rule, RuleSet } from '../models/rule.js';

type Relevance = 'name' | 'description' | 'tag';

export interface RuleWithRelevance extends Rule {
  relevance: Relevance;
}

function normalizeRuleSetName(name: string): string {
  return name.toLowerCase().replace(/[_\s]+/g, '-');
}

export function filterRulesByRuleSet(rules: Rule[], ruleSetQuery: string): Rule[] {
  const normalizedQuery = normalizeRuleSetName(ruleSetQuery);
  
  return rules.filter(rule => {
    const normalizedRuleSet = normalizeRuleSetName(rule.ruleSet);
    return normalizedRuleSet === normalizedQuery;
  });
}

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

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 2);
}

function matchesAllTokens(text: string, tokens: string[]): boolean {
  const lowerText = text.toLowerCase();
  return tokens.every(token => lowerText.includes(token));
}

export function searchRules(
  rules: Rule[], 
  query: string, 
  ruleSetFilter?: string
): RuleWithRelevance[] {
  let rulesToSearch = rules;
  
  if (ruleSetFilter) {
    rulesToSearch = filterRulesByRuleSet(rules, ruleSetFilter);
  }
  
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return [];
  }
  
  const results: RuleWithRelevance[] = [];
  
  for (const rule of rulesToSearch) {
    let relevance: Relevance | null = null;
    
    if (matchesAllTokens(rule.name, tokens)) {
      relevance = 'name';
    } else if (matchesAllTokens(rule.description, tokens)) {
      relevance = 'description';
    } else if (rule.tags) {
      const tagsText = rule.tags.join(' ');
      if (matchesAllTokens(tagsText, tokens)) {
        relevance = 'tag';
      }
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
