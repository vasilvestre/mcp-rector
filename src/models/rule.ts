/**
 * Represents a single Rector refactoring rule with metadata.
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  ruleSet: string;
  classPath?: string;
  status?: 'stable' | 'deprecated' | 'experimental';
  configurable?: boolean;
  tags?: string[];
}

/**
 * Represents a collection/category of related Rector rules.
 */
export interface RuleSet {
  name: string;
  displayName: string;
  description?: string;
  ruleCount: number;
}
