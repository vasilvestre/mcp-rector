import { Rule, RuleSet } from '../models/rule.js';

/**
 * Raw rule data parsed from markdown before validation.
 */
interface RawRule {
  name: string;
  description: string;
  category: string;
  classPath?: string;
  configurable: boolean;
}

/**
 * Common English words to exclude from search tags.
 */
const commonWords = ['this', 'that', 'with', 'from', 'have', 'will', 'been', 'were', 'rector', 'rule', 'your', 'code'];

/**
 * Extracts search tags from rule name and description.
 * @param name - The rule name (PascalCase)
 * @param description - The rule description
 * @returns Array of lowercase keywords for search
 */
export function extractSearchTags(name: string, description: string): string[] {
  const nameWords = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2);

  const descWords = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !commonWords.includes(word))
    .slice(0, 10);

  return [...new Set([...nameWords, ...descWords])];
}

/**
 * Validates and transforms a raw rule into a proper Rule object.
 * @param raw - The raw rule data from markdown parsing
 * @returns A valid Rule object or null if validation fails
 */
export function validateRule(raw: Partial<RawRule>): Rule | null {
  if (!raw.name?.trim() || 
      !raw.description?.trim() || 
      !raw.category?.trim()) {
    return null;
  }

  const id = raw.name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  const tags = extractSearchTags(raw.name, raw.description);

  return {
    id,
    name: raw.name.trim(),
    description: raw.description.trim(),
    ruleSet: raw.category.trim(),
    classPath: raw.classPath?.trim(),
    status: 'stable',
    configurable: raw.configurable || false,
    tags
  };
}

/**
 * Parses the Rector markdown documentation into a list of validated rules.
 * @param markdown - The raw markdown content from GitHub
 * @returns Array of validated Rule objects
 */
export function parseRectorMarkdown(markdown: string): Rule[] {
  const rules: Rule[] = [];

  const sections = markdown.split(/\n## /).slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const category = lines[0].trim();

    if (category === 'Categories') continue;

    const ruleTexts = section.split(/\n### /).slice(1);

    for (const ruleText of ruleTexts) {
      const ruleLines = ruleText.split('\n');
      const name = ruleLines[0].trim();

      let description = '';
      let classPath: string | undefined;
      let configurable = false;

      for (let i = 1; i < ruleLines.length; i++) {
        const line = ruleLines[i].trim();

        if (!description && line && !line.startsWith(':') && !line.startsWith('-') && !line.startsWith('```')) {
          description = line;
        }

        if (line.includes(':wrench:')) {
          configurable = true;
        }

        if (line.startsWith('- class:')) {
          const match = line.match(/\[`([^`]+)`\]/);
          if (match) classPath = match[1];
        }

        if (line.startsWith('```') || line.startsWith('##')) break;
      }

      const validatedRule = validateRule({ 
        name, 
        description, 
        category, 
        classPath, 
        configurable 
      });

      if (validatedRule) {
        rules.push(validatedRule);
      }
    }
  }

  return rules;
}

/**
 * Formats a rule set name into a human-readable display name.
 * @param name - The raw rule set name (e.g., "Php80", "CodeQuality")
 * @returns A formatted display name (e.g., "PHP 8.0", "Code Quality")
 */
function formatDisplayName(name: string): string {
  if (/^Php\d+$/.test(name)) {
    const version = name.substring(3);
    const major = version[0];
    const minor = version[1] || '0';
    return `PHP ${major}.${minor}`;
  }

  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

/**
 * Derives rule sets from the parsed rules by grouping them by category.
 * @param rules - Array of validated rules
 * @returns Array of RuleSet objects with counts
 */
export function deriveRuleSets(rules: Rule[]): RuleSet[] {
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

  return Array.from(setMap.values())
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
