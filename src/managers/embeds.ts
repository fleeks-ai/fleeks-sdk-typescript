import type { FleeksClient } from '../client';
import type {
  EmbedInfo,
  CreateEmbedOptions,
  UpdateEmbedOptions,
  ListEmbedsOptions,
  EmbedSession,
  EmbedAnalytics,
  EmbedStatusChangeResponse,
} from '../types/embed';
import { EmbedTemplate, DisplayMode } from '../types/embed';

const EMBED_PREFIX = 'api/v1';

/**
 * An Embed instance with methods for managing a specific embed.
 */
export class Embed {
  readonly id: string;
  readonly info: EmbedInfo;

  private client: FleeksClient;

  constructor(client: FleeksClient, info: EmbedInfo) {
    this.client = client;
    this.info = info;
    this.id = info.id;
  }

  /** The public embed URL */
  get embedUrl(): string {
    return `https://embed.fleeks.ai/${this.id}`;
  }

  /** HTML iframe snippet for embedding */
  get iframeHtml(): string {
    return `<iframe src="${this.embedUrl}" width="100%" height="600" frameborder="0" allow="clipboard-read; clipboard-write" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>`;
  }

  /** Markdown/JSX component reference */
  get markdownEmbed(): string {
    return `<FleeksEmbed id="${this.id}" />`;
  }

  /**
   * Refresh embed data from the API.
   */
  async refresh(): Promise<Embed> {
    const data = await this.client.httpClient.request<EmbedInfo>(
      'GET',
      `embeds/${this.id}`,
      { prefixOverride: EMBED_PREFIX }
    );
    return new Embed(this.client, data);
  }

  /**
   * Update embed configuration.
   * @param options Fields to update
   */
  async update(options: Partial<UpdateEmbedOptions>): Promise<Embed> {
    const data = await this.client.httpClient.request<EmbedInfo>(
      'PATCH',
      `embeds/${this.id}`,
      { body: options as Record<string, unknown>, prefixOverride: EMBED_PREFIX }
    );
    return new Embed(this.client, data);
  }

  /**
   * Update a single file in the embed.
   * @param path File path
   * @param content File content
   */
  async updateFile(path: string, content: string): Promise<Embed> {
    return this.update({ files: { [path]: content } });
  }

  /**
   * Get active sessions for this embed.
   */
  async getSessions(): Promise<EmbedSession[]> {
    return this.client.httpClient.request<EmbedSession[]>(
      'GET',
      `embeds/${this.id}/sessions`,
      { prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Terminate a specific session.
   * @param sessionId Session identifier
   */
  async terminateSession(sessionId: string): Promise<void> {
    await this.client.httpClient.request(
      'DELETE',
      `embeds/${this.id}/sessions/${sessionId}`,
      { prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Terminate all active sessions.
   * @returns Number of sessions terminated
   */
  async terminateAllSessions(): Promise<number> {
    const sessions = await this.getSessions();
    await Promise.all(
      sessions.map(s => this.terminateSession(s.sessionId))
    );
    return sessions.length;
  }

  /**
   * Get analytics for this embed.
   * @param period Time period (e.g., '7d', '30d')
   */
  async getAnalytics(period?: string): Promise<EmbedAnalytics> {
    const params: Record<string, string> = {};
    if (period) params.period = period;

    return this.client.httpClient.request<EmbedAnalytics>(
      'GET',
      `embeds/${this.id}/analytics`,
      { params, prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Pause this embed.
   */
  async pause(): Promise<EmbedStatusChangeResponse> {
    return this.client.httpClient.request<EmbedStatusChangeResponse>(
      'POST',
      `embeds/${this.id}/pause`,
      { prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Resume a paused embed.
   */
  async resume(): Promise<EmbedStatusChangeResponse> {
    return this.client.httpClient.request<EmbedStatusChangeResponse>(
      'POST',
      `embeds/${this.id}/resume`,
      { prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Archive this embed.
   */
  async archive(): Promise<EmbedStatusChangeResponse> {
    return this.client.httpClient.request<EmbedStatusChangeResponse>(
      'POST',
      `embeds/${this.id}/archive`,
      { prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Delete this embed.
   */
  async delete(): Promise<void> {
    await this.client.httpClient.request(
      'DELETE',
      `embeds/${this.id}`,
      { prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Duplicate this embed.
   * @param newName Optional name for the duplicate
   */
  async duplicate(newName?: string): Promise<Embed> {
    const data = await this.client.httpClient.request<EmbedInfo>(
      'POST',
      `embeds/${this.id}/duplicate`,
      {
        prefixOverride: EMBED_PREFIX,
        ...(newName && { body: { name: newName } }),
      }
    );
    return new Embed(this.client, data);
  }
}

/**
 * Manages embed CRUD operations.
 * NOTE: Embed endpoints use /api/v1/embeds/ NOT /api/v1/sdk/embeds/
 */
export class EmbedManager {
  private client: FleeksClient;

  constructor(client: FleeksClient) {
    this.client = client;
  }

  /**
   * Create a new embed.
   * @param options Embed creation options
   */
  async create(options: CreateEmbedOptions): Promise<Embed> {
    const data = await this.client.httpClient.request<EmbedInfo>(
      'POST',
      'embeds',
      { body: options as unknown as Record<string, unknown>, prefixOverride: EMBED_PREFIX }
    );
    return new Embed(this.client, data);
  }

  /**
   * List all embeds.
   * @param options List options
   */
  async list(options?: ListEmbedsOptions): Promise<Embed[]> {
    const params: Record<string, string> = {};
    if (options?.page !== undefined) params.page = String(options.page);
    if (options?.pageSize !== undefined) params.page_size = String(options.pageSize);
    if (options?.includeInactive !== undefined) params.include_inactive = String(options.includeInactive);
    if (options?.template) params.template = options.template;
    if (options?.search) params.search = options.search;

    const data = await this.client.httpClient.request<EmbedInfo[]>(
      'GET',
      'embeds',
      { params, prefixOverride: EMBED_PREFIX }
    );
    const items = Array.isArray(data) ? data : (data as unknown as { results: EmbedInfo[] }).results ?? [];
    return items.map(info => new Embed(this.client, info));
  }

  /**
   * Get a specific embed by ID.
   * @param embedId Embed identifier
   */
  async get(embedId: string): Promise<Embed> {
    const data = await this.client.httpClient.request<EmbedInfo>(
      'GET',
      `embeds/${embedId}`,
      { prefixOverride: EMBED_PREFIX }
    );
    return new Embed(this.client, data);
  }

  /**
   * Delete an embed by ID.
   * @param embedId Embed identifier
   */
  async delete(embedId: string): Promise<void> {
    await this.client.httpClient.request(
      'DELETE',
      `embeds/${embedId}`,
      { prefixOverride: EMBED_PREFIX }
    );
  }

  /**
   * Get total analytics across all embeds.
   * @param period Time period (e.g., '7d', '30d')
   */
  async getTotalAnalytics(period?: string): Promise<Record<string, unknown>> {
    const params: Record<string, string> = {};
    if (period) params.period = period;

    return this.client.httpClient.request<Record<string, unknown>>(
      'GET',
      'embeds/analytics/total',
      { params, prefixOverride: EMBED_PREFIX }
    );
  }

  // ── Convenience factory methods ───────────────────────────

  /**
   * Create a React embed.
   */
  async createReact(
    name: string,
    files: Record<string, string>,
    options?: Partial<CreateEmbedOptions>
  ): Promise<Embed> {
    return this.create({
      name,
      template: EmbedTemplate.REACT,
      files,
      displayMode: DisplayMode.WEB_PREVIEW,
      ...options,
    });
  }

  /**
   * Create a Python embed.
   */
  async createPython(
    name: string,
    files: Record<string, string>,
    options?: Partial<CreateEmbedOptions>
  ): Promise<Embed> {
    return this.create({
      name,
      template: EmbedTemplate.PYTHON,
      files,
      displayMode: DisplayMode.TERMINAL_ONLY,
      ...options,
    });
  }

  /**
   * Create a Jupyter notebook embed.
   */
  async createJupyter(
    name: string,
    files?: Record<string, string>,
    options?: Partial<CreateEmbedOptions>
  ): Promise<Embed> {
    return this.create({
      name,
      template: EmbedTemplate.JUPYTER,
      files,
      displayMode: DisplayMode.NOTEBOOK,
      ...options,
    });
  }

  /**
   * Create a static HTML embed.
   */
  async createStatic(
    name: string,
    files: Record<string, string>,
    options?: Partial<CreateEmbedOptions>
  ): Promise<Embed> {
    return this.create({
      name,
      template: EmbedTemplate.STATIC,
      files,
      displayMode: DisplayMode.WEB_PREVIEW,
      ...options,
    });
  }
}
