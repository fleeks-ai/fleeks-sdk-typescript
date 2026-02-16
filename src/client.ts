import { FleeksConfig, DEFAULT_CONFIG } from './config';
import { validateApiKey } from './auth';
import { HttpClient } from './http';
import { WorkspaceManager } from './managers/workspaces';
import { EmbedManager } from './managers/embeds';
import { StreamingClient } from './managers/streaming';

export class FleeksClient {
  readonly config: FleeksConfig;
  /** @internal */
  readonly httpClient: HttpClient;

  // Lazy-loaded managers (private backing fields)
  private _workspaces?: WorkspaceManager;
  private _embeds?: EmbedManager;
  private _streaming?: StreamingClient;

  constructor(options: { apiKey?: string; config?: Partial<FleeksConfig> } = {}) {
    const apiKey = options.apiKey
      ?? options.config?.apiKey
      ?? (typeof process !== 'undefined' ? process.env.FLEEKS_API_KEY : undefined)
      ?? '';

    validateApiKey(apiKey);

    this.config = { ...DEFAULT_CONFIG, ...options.config, apiKey };
    this.httpClient = new HttpClient(this.config);
  }

  // ── Lazy-loaded service managers ──────────────────────────

  get workspaces(): WorkspaceManager {
    this._workspaces ??= new WorkspaceManager(this);
    return this._workspaces;
  }

  get embeds(): EmbedManager {
    this._embeds ??= new EmbedManager(this);
    return this._embeds;
  }

  get streaming(): StreamingClient {
    this._streaming ??= new StreamingClient(this.config);
    return this._streaming;
  }

  // ── HTTP shorthand methods ────────────────────────────────

  async get<T = Record<string, unknown>>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    return this.httpClient.request<T>('GET', endpoint, { params });
  }

  async post<T = Record<string, unknown>>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    return this.httpClient.request<T>('POST', endpoint, { body });
  }

  async put<T = Record<string, unknown>>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    return this.httpClient.request<T>('PUT', endpoint, { body });
  }

  async patch<T = Record<string, unknown>>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    return this.httpClient.request<T>('PATCH', endpoint, { body });
  }

  async delete<T = Record<string, unknown>>(
    endpoint: string
  ): Promise<T> {
    return this.httpClient.request<T>('DELETE', endpoint);
  }

  // ── Utility methods ───────────────────────────────────────

  async healthCheck(): Promise<Record<string, unknown>> {
    return this.httpClient.request('GET', '/health', { skipPrefix: true });
  }

  async getUsageStats(): Promise<Record<string, unknown>> {
    return this.get('usage/stats');
  }

  async getApiKeyInfo(): Promise<Record<string, unknown>> {
    return this.get('auth/key-info');
  }

  async close(): Promise<void> {
    await this._streaming?.disconnect();
  }

  // Support TC39 Explicit Resource Management (Symbol.asyncDispose)
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}

/**
 * Convenience factory for creating a FleeksClient.
 */
export function createClient(
  apiKey?: string,
  config?: Partial<FleeksConfig>
): FleeksClient {
  return new FleeksClient({ apiKey, config });
}
