/**
 * Automation trigger types.
 *
 * Matches backend models in:
 *   app/api/api_v1/endpoints/sdk/agent_channels.py (automation section)
 */

// ── Automation ────────────────────────────────────────────

export interface Automation {
  automationId: string;
  scheduleId: string;
  name: string;
  description?: string;
  triggerType: string;
  webhookUrl?: string;
  webhookSecret?: string;
  eventFilter: Record<string, unknown>;
  isActive: boolean;
  triggerCount: number;
  lastTriggeredAt?: string;
  cooldownSeconds: number;
  maxTriggersPerHour: number;
  createdAt: string;
}

export interface AutomationList {
  automations: Automation[];
  total: number;
}

// ── Create / Update ───────────────────────────────────────

export interface CreateAutomationOptions {
  /** Agent schedule to trigger. */
  scheduleId: string;
  /** Automation name (1-255 chars). */
  name: string;
  /**
   * Trigger type: "webhook", "cron", "github_push", "github_pr",
   * "github_issue", "slack_mention", "email_received", "file_change",
   * "api_call", "schedule", "container_event", "custom_event".
   */
  triggerType: string;
  description?: string;
  webhookUrl?: string;
  eventFilter?: Record<string, unknown>;
  /** Jinja2 template for the task prompt. */
  taskTemplate?: string;
  /** Map event payload fields to template variables. */
  contextMapping?: Record<string, string>;
  cooldownSeconds?: number;
  maxTriggersPerHour?: number;
}

export interface UpdateAutomationOptions {
  name?: string;
  description?: string;
  eventFilter?: Record<string, unknown>;
  taskTemplate?: string;
  contextMapping?: Record<string, string>;
  cooldownSeconds?: number;
  maxTriggersPerHour?: number;
}

export interface ListAutomationsOptions {
  scheduleId: string;
  limit?: number;
  offset?: number;
}

// ── Test ──────────────────────────────────────────────────

export interface AutomationTestResult {
  automationId: string;
  triggerType: string;
  dryRun: boolean;
  renderedTask: string;
  eventFilterMatch: boolean;
  message: string;
}
