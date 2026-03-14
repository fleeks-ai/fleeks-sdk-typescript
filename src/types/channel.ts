/**
 * Channel types for messaging integrations.
 *
 * Matches backend models in:
 *   app/api/api_v1/endpoints/sdk/agent_channels.py
 */

// ── Channel Type Info ─────────────────────────────────────

export interface ChannelTypeInfo {
  typeId: string;
  name: string;
  description: string;
  requiredCredentials: string[];
  optionalCredentials: string[];
  authFlow: string;   // "token" | "oauth" | "qr_code" | "api_key"
  docsUrl: string;
}

// ── Channel ───────────────────────────────────────────────

export interface Channel {
  channelId: string;
  scheduleId: string;
  channelType: string;
  channelName?: string;
  status: string;
  isActive: boolean;
  connectedAt?: string;
  routeToAgents: string[];
  defaultAgent?: string;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  messagesReceived: number;
  messagesSent: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ChannelList {
  channels: Channel[];
  total: number;
}

// ── Create / Update ───────────────────────────────────────

export interface CreateChannelOptions {
  /** Agent schedule to connect this channel to. */
  scheduleId: string;
  /** Channel type (e.g., "slack", "discord", "whatsapp"). */
  channelType: string;
  channelName?: string;
  /** Channel-specific credentials (bot token, etc.). */
  credentials?: Record<string, string>;
  routeToAgents?: string[];
  defaultAgent?: string;
  messageFilter?: Record<string, unknown>;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
}

export interface UpdateChannelOptions {
  channelName?: string;
  routeToAgents?: string[];
  defaultAgent?: string;
  messageFilter?: Record<string, unknown>;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
}

export interface ListChannelsOptions {
  scheduleId: string;
  limit?: number;
  offset?: number;
}

// ── Auth Flow ─────────────────────────────────────────────

export interface AuthFlowResult {
  authType: string;
  status: string;
  data: Record<string, unknown>;
  message: string;
}
