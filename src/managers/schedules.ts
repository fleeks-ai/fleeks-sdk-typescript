/**
 * Schedule manager — CRUD + daemon lifecycle + quota.
 *
 * Matches backend:
 *   POST   /sdk/schedules/
 *   GET    /sdk/schedules/
 *   GET    /sdk/schedules/{id}
 *   PUT    /sdk/schedules/{id}
 *   DELETE /sdk/schedules/{id}
 *   POST   /sdk/schedules/{id}/start
 *   POST   /sdk/schedules/{id}/stop
 *   POST   /sdk/schedules/{id}/pause
 *   POST   /sdk/schedules/{id}/resume
 *   GET    /sdk/schedules/{id}/status
 *   GET    /sdk/schedules/{id}/logs
 *   GET    /sdk/schedules/quota
 */

import type { FleeksClient } from '../client';
import type {
  Schedule,
  ScheduleList,
  CreateScheduleOptions,
  UpdateScheduleOptions,
  ListSchedulesOptions,
  ScheduleStartResult,
  DaemonStatusInfo,
  DaemonLogs,
  QuotaUsage,
} from '../types/schedule';

export class ScheduleManager {
  private client: FleeksClient;

  constructor(client: FleeksClient) {
    this.client = client;
  }

  // ── CRUD ──────────────────────────────────────────────

  /**
   * Create a new agent schedule.
   *
   * @example
   * ```ts
   * const sched = await client.schedules.create({
   *   name: 'PR Review Bot',
   *   scheduleType: 'always_on',
   *   agentType: 'code',
   *   skills: ['code-review', 'security-audit'],
   * });
   * ```
   */
  async create(options: CreateScheduleOptions): Promise<Schedule> {
    return this.client.post<Schedule>('schedules', {
      name: options.name,
      schedule_type: options.scheduleType ?? 'manual',
      ...(options.description !== undefined && { description: options.description }),
      ...(options.projectId !== undefined && { project_id: options.projectId }),
      ...(options.cronExpression !== undefined && { cron_expression: options.cronExpression }),
      ...(options.intervalSeconds !== undefined && { interval_seconds: options.intervalSeconds }),
      timezone: options.timezone ?? 'UTC',
      agent_type: options.agentType ?? 'auto',
      ...(options.defaultTask !== undefined && { default_task: options.defaultTask }),
      max_iterations: options.maxIterations ?? 25,
      ...(options.systemPrompt !== undefined && { system_prompt: options.systemPrompt }),
      ...(options.modelOverride !== undefined && { model_override: options.modelOverride }),
      ...(options.skills && { skills: options.skills }),
      auto_detect_skills: options.autoDetectSkills ?? true,
      ...(options.soulPrompt !== undefined && { soul_prompt: options.soulPrompt }),
      ...(options.agentsConfig !== undefined && { agents_config: options.agentsConfig }),
      container_class: options.containerClass ?? 'standard',
      container_timeout_hours: options.containerTimeoutHours ?? 24.0,
      auto_restart: options.autoRestart ?? true,
      max_restarts: options.maxRestarts ?? 5,
      memory_limit_mb: options.memoryLimitMb ?? 2048,
      cpu_limit_cores: options.cpuLimitCores ?? 1.0,
      ...(options.tags && { tags: options.tags }),
    });
  }

  /** List agent schedules. */
  async list(options?: ListSchedulesOptions): Promise<ScheduleList> {
    const params: Record<string, string> = {};
    params.active_only = String(options?.activeOnly ?? true);
    if (options?.scheduleType) params.schedule_type = options.scheduleType;
    params.limit = String(options?.limit ?? 50);
    params.offset = String(options?.offset ?? 0);

    return this.client.get<ScheduleList>('schedules', params);
  }

  /** Get schedule details by ID. */
  async get(scheduleId: string): Promise<Schedule> {
    return this.client.get<Schedule>(`schedules/${scheduleId}`);
  }

  /** Update a schedule. Only pass fields you want to change. */
  async update(scheduleId: string, options: UpdateScheduleOptions): Promise<Schedule> {
    return this.client.put<Schedule>(`schedules/${scheduleId}`, options as Record<string, unknown>);
  }

  /** Delete a schedule. Stops any running daemons. */
  async delete(scheduleId: string): Promise<void> {
    await this.client.delete(`schedules/${scheduleId}`);
  }

  // ── DAEMON LIFECYCLE ──────────────────────────────────

  /**
   * Start a schedule / provision its daemon.
   *
   * Returns immediately — poll `status()` for readiness.
   *
   * @example
   * ```ts
   * const result = await client.schedules.start('sched_abc');
   * // Poll until running
   * let info = await client.schedules.status('sched_abc');
   * while (info.status === 'provisioning' || info.status === 'starting') {
   *   await new Promise(r => setTimeout(r, 2000));
   *   info = await client.schedules.status('sched_abc');
   * }
   * console.log('Daemon running!');
   * ```
   */
  async start(scheduleId: string): Promise<ScheduleStartResult> {
    return this.client.post<ScheduleStartResult>(`schedules/${scheduleId}/start`);
  }

  /** Stop a running schedule / teardown daemon. */
  async stop(scheduleId: string, graceful = true): Promise<Record<string, unknown>> {
    return this.client.post(`schedules/${scheduleId}/stop`, { graceful });
  }

  /** Pause a schedule (daemon stays alive, stops processing). */
  async pause(scheduleId: string): Promise<Record<string, unknown>> {
    return this.client.post(`schedules/${scheduleId}/pause`);
  }

  /** Resume a paused schedule. */
  async resume(scheduleId: string): Promise<Record<string, unknown>> {
    return this.client.post(`schedules/${scheduleId}/resume`);
  }

  // ── OBSERVABILITY ─────────────────────────────────────

  /** Get daemon runtime status (health, uptime, resources). */
  async status(scheduleId: string): Promise<DaemonStatusInfo> {
    return this.client.get<DaemonStatusInfo>(`schedules/${scheduleId}/status`);
  }

  /** Get daemon logs. */
  async logs(scheduleId: string, tail = 100): Promise<DaemonLogs> {
    return this.client.get<DaemonLogs>(`schedules/${scheduleId}/logs`, { tail: String(tail) });
  }

  // ── QUOTA ─────────────────────────────────────────────

  /**
   * Get agent-hours quota usage for the current billing period.
   *
   * @example
   * ```ts
   * const quota = await client.schedules.quota();
   * console.log(`Used: ${quota.agentHours.used}h / ${quota.agentHours.limit}h`);
   * ```
   */
  async quota(): Promise<QuotaUsage> {
    return this.client.get<QuotaUsage>('schedules/quota');
  }
}
