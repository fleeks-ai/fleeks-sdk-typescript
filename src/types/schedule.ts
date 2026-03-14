/**
 * Schedule / Always-On Agent types.
 *
 * Matches backend models in:
 *   app/api/api_v1/endpoints/sdk/agent_schedules.py
 */

// ── Enums ─────────────────────────────────────────────────

export enum ScheduleType {
  ALWAYS_ON = 'always_on',
  CRON = 'cron',
  WEBHOOK = 'webhook',
  EVENT = 'event',
  MANUAL = 'manual',
  INTERVAL = 'interval',
}

export enum DaemonStatusEnum {
  PENDING = 'pending',
  PROVISIONING = 'provisioning',
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSED = 'paused',
  UNHEALTHY = 'unhealthy',
  RESTARTING = 'restarting',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  CRASHED = 'crashed',
  ERROR = 'error',
}

// ── Schedule ──────────────────────────────────────────────

export interface Schedule {
  scheduleId: string;
  name: string;
  description?: string;
  scheduleType: string;
  cronExpression?: string;
  intervalSeconds?: number;
  timezone: string;
  agentType: string;
  defaultTask?: string;
  maxIterations: number;
  skills: string[];
  isActive: boolean;
  isPaused: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  errorCount: number;
  lastError?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  daemonStatus?: string;
  daemonId?: string;
}

export interface ScheduleList {
  schedules: Schedule[];
  total: number;
}

// ── Create / Update ───────────────────────────────────────

export interface CreateScheduleOptions {
  /** Schedule name (required, 1-255 chars). */
  name: string;
  /** One of "always_on", "cron", "webhook", "event", "manual", "interval". */
  scheduleType?: string;
  description?: string;
  projectId?: number;
  /** Required for "cron" type (e.g., "0 9 * * MON-FRI"). */
  cronExpression?: string;
  /** Required for "interval" type (60-86400). */
  intervalSeconds?: number;
  /** IANA timezone (default: "UTC"). */
  timezone?: string;
  /** "auto", "code", "research", "debug", "assistant". */
  agentType?: string;
  defaultTask?: string;
  maxIterations?: number;
  systemPrompt?: string;
  modelOverride?: string;
  skills?: string[];
  autoDetectSkills?: boolean;
  soulPrompt?: string;
  agentsConfig?: Record<string, unknown>;
  containerClass?: string;
  containerTimeoutHours?: number;
  autoRestart?: boolean;
  maxRestarts?: number;
  memoryLimitMb?: number;
  cpuLimitCores?: number;
  tags?: string[];
}

export interface UpdateScheduleOptions {
  name?: string;
  description?: string;
  cronExpression?: string;
  intervalSeconds?: number;
  timezone?: string;
  agentType?: string;
  defaultTask?: string;
  maxIterations?: number;
  systemPrompt?: string;
  modelOverride?: string;
  skills?: string[];
  autoDetectSkills?: boolean;
  soulPrompt?: string;
  agentsConfig?: Record<string, unknown>;
  autoRestart?: boolean;
  maxRestarts?: number;
  memoryLimitMb?: number;
  tags?: string[];
}

export interface ListSchedulesOptions {
  activeOnly?: boolean;
  scheduleType?: string;
  limit?: number;
  offset?: number;
}

// ── Daemon ────────────────────────────────────────────────

export interface ScheduleStartResult {
  scheduleId: string;
  daemonId: string;
  status: string;
  containerId?: string;
  message: string;
}

export interface DaemonStatusInfo {
  daemonId: string;
  scheduleId: string;
  status: string;
  containerId?: string;
  gatewayPort?: number;
  startedAt?: string;
  uptimeSeconds?: number;
  messagesProcessed: number;
  tasksCompleted: number;
  restartCount: number;
  health: Record<string, unknown>;
  channelsConnected: number;
  resourceUsage: Record<string, unknown>;
  /** Project ID of the agent workspace (available since backend v2.8). */
  projectId?: number | null;
  /** Owner user ID — now tracked for billing (available since backend v2.8). */
  userId?: number | null;
}

export interface DaemonLogs {
  daemonId: string;
  containerId?: string;
  logs: string;
  tail: number;
}

// ── Quota ─────────────────────────────────────────────────

export interface QuotaMetric {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  overageHours?: number;
  overageCost?: number;
}

export interface QuotaCounter {
  current: number;
  limit: number;
}

export interface QuotaUsage {
  userId: number;
  billingPeriod: Record<string, unknown>;
  agentHours: QuotaMetric;
  alwaysOnAgents: QuotaCounter;
  channels: QuotaCounter;
  automations: QuotaCounter;
}
