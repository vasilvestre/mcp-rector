import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseRectorMarkdown } from './rule-parser.js';

describe('parseRectorMarkdown', () => {
    it('should parse Rector rules from markdown', () => {
        const markdown = `
# Rector Rules Overview

## Coding Style

### RemoveUnusedVariableRule

Remove unused variables from code

- class: [\`Rector\\CodingStyle\\Rector\\ClassMethod\\RemoveUnusedVariableRule\`]

## PHP 8.0

### UnionTypesRule

Add union types where possible

- class: [\`Rector\\Php80\\Rector\\FunctionLike\\UnionTypesRule\`]
`;
        
        const rules = parseRectorMarkdown(markdown);
        
        assert.ok(Array.isArray(rules), 'Should return an array');
        assert.strictEqual(rules.length, 2, 'Should parse 2 rules');
        
        const firstRule = rules[0];
        assert.strictEqual(firstRule.name, 'RemoveUnusedVariableRule');
        assert.strictEqual(firstRule.ruleSet, 'Coding Style');
        assert.ok(firstRule.description.includes('Remove unused variables'));
        assert.strictEqual(firstRule.classPath, 'Rector\\CodingStyle\\Rector\\ClassMethod\\RemoveUnusedVariableRule');
    });

    it('should return empty array for empty markdown', () => {
        const rules = parseRectorMarkdown('');
        assert.strictEqual(rules.length, 0);
    });
});
