/**
 * Automation manager — trigger CRUD + dry-run testing.
 *
 * Matches backend:
 *   POST   /sdk/automations/
 *   GET    /sdk/automations/
 *   GET    /sdk/automations/{id}
 *   PUT    /sdk/automations/{id}
 *   DELETE /sdk/automations/{id}
 *   POST   /sdk/automations/{id}/test
 */

import type { FleeksClient } from '../client';
import type {
  Automation,
  AutomationList,
  CreateAutomationOptions,
  UpdateAutomationOptions,
  ListAutomationsOptions,
  AutomationTestResult,
} from '../types/automation';

export class AutomationManager {
  private client: FleeksClient;

  constructor(client: FleeksClient) {
    this.client = client;
  }

  // ── CRUD ──────────────────────────────────────────────

  /**
   * Create an automation trigger.
   *
   * @example
   * ```ts
   * const auto = await client.automations.create({
   *   scheduleId: 'sched_abc',
   *   name: 'Auto-review PRs',
   *   triggerType: 'github_pr',
   *   eventFilter: { action: ['opened'], base_branch: 'main' },
   *   taskTemplate: 'Review PR #{{ pr_number }}: {{ pr_title }}',
   *   contextMapping: {
   *     pr_number: 'pull_request.number',
   *     pr_title: 'pull_request.title',
   *   },
   * });
   * console.log(`Webhook URL: ${auto.webhookUrl}`);
   * ```
   */
  async create(options: CreateAutomationOptions): Promise<Automation> {
    return this.client.post<Automation>('automations', {
      schedule_id: options.scheduleId,
      name: options.name,
      trigger_type: options.triggerType,
      ...(options.description !== undefined && { description: options.description }),
      ...(options.webhookUrl !== undefined && { webhook_url: options.webhookUrl }),
      ...(options.eventFilter && { event_filter: options.eventFilter }),
      ...(options.taskTemplate !== undefined && { task_template: options.taskTemplate }),
      ...(options.contextMapping && { context_mapping: options.contextMapping }),
      cooldown_seconds: options.cooldownSeconds ?? 0,
      max_triggers_per_hour: options.maxTriggersPerHour ?? 60,
    });
  }

  /** List automations for a schedule. */
  async list(options: ListAutomationsOptions): Promise<AutomationList> {
    const params: Record<string, string> = {
      schedule_id: options.scheduleId,
      limit: String(options.limit ?? 50),
      offset: String(options.offset ?? 0),
    };
    return this.client.get<AutomationList>('automations', params);
  }

  /** Get automation details by ID. */
  async get(automationId: string): Promise<Automation> {
    return this.client.get<Automation>(`automations/${automationId}`);
  }

  /** Update an automation. Only pass fields you want to change. */
  async update(automationId: string, options: UpdateAutomationOptions): Promise<Automation> {
    return this.client.put<Automation>(
      `automations/${automationId}`,
      options as Record<string, unknown>,
    );
  }

  /** Remove an automation. */
  async delete(automationId: string): Promise<void> {
    await this.client.delete(`automations/${automationId}`);
  }

  // ── TESTING ───────────────────────────────────────────

  /**
   * Dry-run test an automation with a sample payload.
   *
   * Validates event filter matching and renders the task template
   * without actually triggering the agent.
   *
   * @example
   * ```ts
   * const result = await client.automations.test('auto_xyz', {
   *   action: 'opened',
   *   pull_request: { number: 42, title: 'Fix bug', body: 'Fixes #123' },
   * });
   * console.log(result.renderedTask);
   * console.log(`Filter match: ${result.eventFilterMatch}`);
   * ```
   */
  async test(
    automationId: string,
    payload?: Record<string, unknown>,
  ): Promise<AutomationTestResult> {
    return this.client.post<AutomationTestResult>(
      `automations/${automationId}/test`,
      payload ?? {},
    );
  }
}
