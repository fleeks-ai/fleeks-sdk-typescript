/**
 * AI provider key manager — BYOK (bring your own key).
 *
 * Matches backend:
 *   PUT    /integrations/ai-keys/{provider}
 *   GET    /integrations/ai-keys
 *   DELETE /integrations/ai-keys/{provider}
 */

import type { FleeksClient } from '../client';
import type { AIKeyInfo, AIKeyDeleteResult } from '../types/ai-keys';

const PREFIX = 'api/v1/integrations';

export class AIKeysManager {
  private client: FleeksClient;

  constructor(client: FleeksClient) {
    this.client = client;
  }

  /**
   * Store or update an AI provider API key.
   *
   * @param provider - One of openai, anthropic, google, openrouter
   * @param apiKey   - The raw API key string
   *
   * @example
   * ```ts
   * const info = await client.aiKeys.set('openai', 'sk-proj-...');
   * console.log(info.keyPrefix); // "sk-proj-..."
   * ```
   */
  async set(provider: string, apiKey: string): Promise<AIKeyInfo> {
    return this.client.httpClient.request<AIKeyInfo>(
      'PUT',
      `ai-keys/${provider}`,
      { body: { api_key: apiKey }, prefixOverride: PREFIX },
    );
  }

  /**
   * List all stored AI provider keys (masked).
   *
   * @example
   * ```ts
   * const keys = await client.aiKeys.list();
   * for (const k of keys) {
   *   console.log(`${k.provider}: ${k.isSet ? k.keyPrefix : 'not set'}`);
   * }
   * ```
   */
  async list(): Promise<AIKeyInfo[]> {
    return this.client.httpClient.request<AIKeyInfo[]>(
      'GET',
      'ai-keys',
      { prefixOverride: PREFIX },
    );
  }

  /**
   * Remove a stored AI provider key.
   *
   * @param provider - One of openai, anthropic, google, openrouter
   */
  async delete(provider: string): Promise<AIKeyDeleteResult> {
    return this.client.httpClient.request<AIKeyDeleteResult>(
      'DELETE',
      `ai-keys/${provider}`,
      { prefixOverride: PREFIX },
    );
  }
}
