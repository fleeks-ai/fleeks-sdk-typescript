// ── Lifecycle Enums ──────────────────────────────────────────

export enum IdleAction {
  SHUTDOWN = 'shutdown',
  HIBERNATE = 'hibernate',
  KEEP_ALIVE = 'keep_alive',
}

export enum LifecycleState {
  RUNNING = 'running',
  HIBERNATING = 'hibernating',
  STOPPED = 'stopped',
  STARTING = 'starting',
  WAKING = 'waking',
}

// ── Lifecycle Interfaces ────────────────────────────────────

export interface LifecycleConfig {
  idleTimeoutMinutes: number;
  maxDurationHours?: number;
  idleAction: IdleAction;
  autoWake: boolean;
  keepAliveOnPreview: boolean;
  heartbeatIntervalSeconds: number;
}

export interface HeartbeatResponse {
  containerId: string;
  status: string;
  lastHeartbeat: string;
  idleTimeoutSeconds: number;
  nextTimeoutAt: string;
  message: string;
}

export interface TimeoutExtensionResponse {
  containerId: string;
  success: boolean;
  newTimeoutAt: string;
  addedMinutes: number;
  maxAllowedMinutes: number;
  message: string;
  minutesExtended: number;
}

export interface KeepAliveResponse {
  containerId: string;
  keepAliveEnabled: boolean;
  requiresTier: string;
  userTier: string;
  isAuthorized: boolean;
  message: string;
}

export interface HibernationResponse {
  containerId: string;
  status: string;
  action: string;
  estimatedResumeSeconds?: number;
  message: string;
  /** Alias for `status` (convenience getter set by the SDK). */
  state: string;
}

export interface LifecycleStatusResponse {
  containerId: string;
  state: string;
  idleTimeoutMinutes: number;
  idleAction: string;
  keepAliveEnabled: boolean;
  lastActivityAt: string;
  timeoutAt?: string;
  timeRemainingSeconds?: number;
  uptimeSeconds: number;
}

// ── Lifecycle Presets ────────────────────────────────────────

export const LifecyclePresets = {
  quickTest: (): LifecycleConfig => ({
    idleTimeoutMinutes: 5,
    idleAction: IdleAction.SHUTDOWN,
    autoWake: false,
    keepAliveOnPreview: false,
    heartbeatIntervalSeconds: 60,
  }),

  development: (): LifecycleConfig => ({
    idleTimeoutMinutes: 120,
    idleAction: IdleAction.HIBERNATE,
    autoWake: true,
    keepAliveOnPreview: true,
    heartbeatIntervalSeconds: 300,
  }),

  agentTask: (): LifecycleConfig => ({
    idleTimeoutMinutes: 30,
    maxDurationHours: 2,
    idleAction: IdleAction.SHUTDOWN,
    autoWake: false,
    keepAliveOnPreview: false,
    heartbeatIntervalSeconds: 120,
  }),

  alwaysOn: (): LifecycleConfig => ({
    idleTimeoutMinutes: 0,
    idleAction: IdleAction.KEEP_ALIVE,
    autoWake: true,
    keepAliveOnPreview: true,
    heartbeatIntervalSeconds: 600,
  }),
};

// ── Tier Limits ─────────────────────────────────────────────

export interface TierLimit {
  maxIdleTimeoutMinutes: number;
  maxExtensions: number;
  hibernate: boolean;
  keepAlive: boolean;
}

export const TIER_LIMITS: Record<string, TierLimit> = {
  FREE: { maxIdleTimeoutMinutes: 30, maxExtensions: 2, hibernate: false, keepAlive: false },
  BASIC: { maxIdleTimeoutMinutes: 60, maxExtensions: 5, hibernate: false, keepAlive: false },
  PRO: { maxIdleTimeoutMinutes: 240, maxExtensions: 10, hibernate: true, keepAlive: false },
  ULTIMATE: { maxIdleTimeoutMinutes: 480, maxExtensions: 20, hibernate: true, keepAlive: true },
  ENTERPRISE: { maxIdleTimeoutMinutes: -1, maxExtensions: -1, hibernate: true, keepAlive: true },
};
