import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fetchRectorMarkdown } from './rector-fetcher.js';

describe('fetchRectorMarkdown', () => {
    it('should fetch Rector rules markdown from GitHub', async () => {
        const markdown = await fetchRectorMarkdown();
        
        assert.ok(typeof markdown === 'string', 'Should return a string');
        assert.ok(markdown.length > 0, 'Should not be empty');
        assert.ok(markdown.includes('Rector Rules Overview') || markdown.includes('##'), 'Should contain markdown headers');
    });
});
