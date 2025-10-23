/**
 * GitHub URL for the Rector rules markdown documentation.
 */
const RECTOR_RULES_URL = 'https://raw.githubusercontent.com/rectorphp/rector/main/docs/rector_rules_overview.md';

/**
 * Fetches a URL with a timeout using native fetch API and AbortController.
 * @param url - The URL to fetch
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns The fetch Response object
 * @throws Error if the request times out or fails
 */
async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'mcp-rector/1.0' }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches the Rector rules markdown from GitHub.
 * @returns The markdown content as a string
 * @throws Error if the fetch fails or times out
 */
export async function fetchRectorMarkdown(): Promise<string> {
  try {
    const response = await fetchWithTimeout(RECTOR_RULES_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw new Error(`Fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
