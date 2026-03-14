/**
 * Channel manager — messaging channel CRUD + auth flows.
 *
 * Matches backend:
 *   GET    /sdk/channels/types
 *   POST   /sdk/channels/
 *   GET    /sdk/channels/
 *   GET    /sdk/channels/{id}
 *   PUT    /sdk/channels/{id}
 *   DELETE /sdk/channels/{id}
 *   POST   /sdk/channels/{id}/auth
 *   GET    /sdk/channels/{id}/auth/status
 *   POST   /sdk/channels/{id}/test
 */

import type { FleeksClient } from '../client';
import type {
  ChannelTypeInfo,
  Channel,
  ChannelList,
  CreateChannelOptions,
  UpdateChannelOptions,
  ListChannelsOptions,
  AuthFlowResult,
} from '../types/channel';

export class ChannelManager {
  private client: FleeksClient;

  constructor(client: FleeksClient) {
    this.client = client;
  }

  // ── CHANNEL TYPES ─────────────────────────────────────

  /**
   * List all supported messaging channel types.
   *
   * @example
   * ```ts
   * const types = await client.channels.types();
   * for (const ct of types) {
   *   console.log(`${ct.typeId}: ${ct.authFlow}`);
   * }
   * ```
   */
  async types(): Promise<ChannelTypeInfo[]> {
    return this.client.get<ChannelTypeInfo[]>('channels/types');
  }

  // ── CRUD ──────────────────────────────────────────────

  /**
   * Add a messaging channel to an agent schedule.
   *
   * @example
   * ```ts
   * const chan = await client.channels.create({
   *   scheduleId: 'sched_abc',
   *   channelType: 'slack',
   *   channelName: 'Team Bot',
   *   credentials: { bot_token: 'xoxb-...' },
   * });
   * ```
   */
  async create(options: CreateChannelOptions): Promise<Channel> {
    return this.client.post<Channel>('channels', {
      schedule_id: options.scheduleId,
      channel_type: options.channelType,
      ...(options.channelName !== undefined && { channel_name: options.channelName }),
      ...(options.credentials && { credentials: options.credentials }),
      ...(options.routeToAgents && { route_to_agents: options.routeToAgents }),
      ...(options.defaultAgent !== undefined && { default_agent: options.defaultAgent }),
      ...(options.messageFilter !== undefined && { message_filter: options.messageFilter }),
      rate_limit_per_minute: options.rateLimitPerMinute ?? 60,
      rate_limit_per_hour: options.rateLimitPerHour ?? 1000,
    });
  }

  /** List channels for a schedule. */
  async list(options: ListChannelsOptions): Promise<ChannelList> {
    const params: Record<string, string> = {
      schedule_id: options.scheduleId,
      limit: String(options.limit ?? 50),
      offset: String(options.offset ?? 0),
    };
    return this.client.get<ChannelList>('channels', params);
  }

  /** Get channel details by ID. */
  async get(channelId: string): Promise<Channel> {
    return this.client.get<Channel>(`channels/${channelId}`);
  }

  /** Update channel configuration. */
  async update(channelId: string, options: UpdateChannelOptions): Promise<Channel> {
    return this.client.put<Channel>(`channels/${channelId}`, options as Record<string, unknown>);
  }

  /** Remove a channel. */
  async delete(channelId: string): Promise<void> {
    await this.client.delete(`channels/${channelId}`);
  }

  // ── AUTH ──────────────────────────────────────────────

  /**
   * Initiate the channel authentication flow.
   *
   * Returns different data depending on the channel type:
   * - **Slack/Teams/Google Chat**: `result.data.oauthUrl` — open in browser.
   * - **WhatsApp/Signal**: `result.data.qrCodeData` — render QR.
   * - **Discord/Telegram**: Token validated immediately.
   *
   * @example
   * ```ts
   * const auth = await client.channels.auth('chan_xyz');
   * if (auth.data.oauthUrl) {
   *   open(auth.data.oauthUrl);
   * }
   * ```
   */
  async auth(channelId: string): Promise<AuthFlowResult> {
    return this.client.post<AuthFlowResult>(`channels/${channelId}/auth`);
  }

  /** Check the authentication status of a pending auth flow. */
  async authStatus(channelId: string): Promise<AuthFlowResult> {
    return this.client.get<AuthFlowResult>(`channels/${channelId}/auth/status`);
  }

  /** Test a channel connection. */
  async test(channelId: string): Promise<Record<string, unknown>> {
    return this.client.post(`channels/${channelId}/test`);
  }
}
