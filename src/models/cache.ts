import { Rule, RuleSet } from './rule.js';

/**
 * Current state of the rule cache.
 */
export type CacheStatus = 'empty' | 'loading' | 'loaded' | 'error';

/**
 * Internal cache state with metadata.
 */
export interface CacheState {
  rules: Rule[];
  ruleSets: RuleSet[];
  lastFetched: Date;
  status: CacheStatus;
}

/**
 * Error information when cache loading fails.
 */
export interface CacheError {
  message: string;
  timestamp: Date;
  hadFallback: boolean;
}

/**
 * Cached Rector rules and rule sets.
 */
export interface CachedData {
  rules: Rule[];
  ruleSets: RuleSet[];
  lastFetched: Date;
}

/**
 * Singleton cache for Rector rules fetched from GitHub.
 * Implements lazy loading with error fallback to stale data.
 */
export class RectorCache {
  private cache: CachedData | null = null;
  private fetchPromise: Promise<CachedData> | null = null;
  private state: CacheState = {
    rules: [],
    ruleSets: [],
    lastFetched: new Date(0),
    status: 'empty'
  };
  private lastError: CacheError | null = null;

  /**
   * Gets all cached Rector rules, loading them if necessary.
   */
  async getRules(): Promise<Rule[]> {
    if (this.cache) {
      return this.cache.rules;
    }
    return (await this.ensureLoaded()).rules;
  }

  /**
   * Gets all cached rule sets, loading them if necessary.
   */
  async getRuleSets(): Promise<RuleSet[]> {
    if (this.cache) {
      return this.cache.ruleSets;
    }
    return (await this.ensureLoaded()).ruleSets;
  }

  /**
   * Returns the current cache status.
   */
  getStatus(): CacheStatus {
    return this.state.status;
  }

  /**
   * Returns the last error that occurred, if any.
   */
  getLastError(): CacheError | null {
    return this.lastError;
  }

  /**
   * Ensures data is loaded, reusing in-flight requests if already loading.
   */
  private async ensureLoaded(): Promise<CachedData> {
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.loadData();
    try {
      this.cache = await this.fetchPromise;
      return this.cache;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Loads data from GitHub, parses it, and caches the result.
   * Falls back to stale data on error if available.
   */
  private async loadData(): Promise<CachedData> {
    this.state.status = 'loading';
    const startTime = Date.now();

    const { fetchRectorMarkdown } = await import('../services/rector-fetcher.js');
    const { parseRectorMarkdown } = await import('../services/rule-parser.js');
    const { deriveRuleSets } = await import('../services/rule-parser.js');

    try {
      const markdown = await fetchRectorMarkdown();
      const rawRules = parseRectorMarkdown(markdown);
      const rules = rawRules;
      const ruleSets = deriveRuleSets(rules);

      const duration = Date.now() - startTime;
      console.error(`[RectorCache] Loaded ${rules.length} rules in ${duration}ms`);

      this.state = {
        rules,
        ruleSets,
        lastFetched: new Date(),
        status: 'loaded'
      };

      this.lastError = null;

      return {
        rules,
        ruleSets,
        lastFetched: new Date()
      };
    } catch (error) {
      const hadFallback = this.state.rules.length > 0;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.lastError = {
        message: errorMessage,
        timestamp: new Date(),
        hadFallback
      };

      this.state.status = 'error';

      if (hadFallback) {
        console.error(`[RectorCache] Cache load failed, using stale data: ${errorMessage}`);
      } else {
        console.error(`[RectorCache] Cache load failed with no fallback: ${errorMessage}`);
      }

      if (!hadFallback) {
        throw error;
      }

      return {
        rules: this.state.rules,
        ruleSets: this.state.ruleSets,
        lastFetched: this.state.lastFetched
      };
    }
  }

  /**
   * Checks if the cache has been loaded.
   */
  isLoaded(): boolean {
    return this.cache !== null;
  }

  /**
   * Clears the cache, forcing a fresh fetch on next access.
   */
  clear(): void {
    this.cache = null;
    this.fetchPromise = null;
    this.state = {
      rules: [],
      ruleSets: [],
      lastFetched: new Date(0),
      status: 'empty'
    };
  }
}

/**
 * Global singleton instance of the Rector rule cache.
 */
export const rectorCache = new RectorCache();
