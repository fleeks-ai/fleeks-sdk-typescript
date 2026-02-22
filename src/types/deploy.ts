/**
 * Deploy types — matches backend SDK deploy endpoint responses.
 */

// ── Enums ───────────────────────────────────────────────────

export enum DeploymentStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ── Request Types ───────────────────────────────────────────

export interface DeployCreateParams {
  /** The Fleeks project ID to deploy. */
  projectId: number;
  /** Target environment (default: "production"). */
  environment?: string;
  /** Optional environment variables to inject. */
  envVars?: Record<string, string>;
}

// ── Response Types ──────────────────────────────────────────

export interface DeployResponse {
  deploymentId: number;
  projectId: number;
  status: string;
  url?: string;
  message: string;
}

export interface DeployStatus {
  deploymentId: number;
  projectId: number;
  status: string;
  url?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  healthStatus?: string;
  framework?: string;
  durationSeconds?: number;
}

/**
 * Rich wrapper around DeployStatus with convenience getters.
 */
export class DeployStatusResult implements DeployStatus {
  readonly deploymentId!: number;
  readonly projectId!: number;
  readonly status!: string;
  readonly url?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly errorMessage?: string;
  readonly healthStatus?: string;
  readonly framework?: string;
  readonly durationSeconds?: number;

  constructor(data: DeployStatus) {
    Object.assign(this, data);
  }

  /** True when the deployment is pending or in progress. */
  get isRunning(): boolean {
    return (
      this.status === DeploymentStatusEnum.PENDING ||
      this.status === DeploymentStatusEnum.IN_PROGRESS
    );
  }

  /** True when the deployment succeeded. */
  get isSucceeded(): boolean {
    return this.status === DeploymentStatusEnum.SUCCEEDED;
  }

  /** True when the deployment failed. */
  get isFailed(): boolean {
    return this.status === DeploymentStatusEnum.FAILED;
  }
}

export interface DeployLogs {
  deploymentId: number;
  status: string;
  logs: string;
  errorMessage?: string;
}

export interface DeployRollbackResult {
  success: boolean;
  revision?: string;
  message?: string;
}

export interface DeployDeleteResult {
  success: boolean;
  message?: string;
  serviceName?: string;
}

export interface DeployListItem {
  deploymentId: number;
  projectId: number;
  deploymentNumber: number;
  environment: string;
  status: string;
  url?: string;
  createdAt?: string;
  healthStatus?: string;
}

export interface DeployListOptions {
  /** Maximum number of results (default 20). */
  limit?: number;
}
