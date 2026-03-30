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
  /**
   * Log source determines the shape of `logs`:
   * - `"redis"`        → structured `DeployLogEvent[]`
   * - `"cloud_logging"` → plain `string` of Cloud Build output
   * - `"stored"`        → plain `string` from the DB column
   */
  source: 'redis' | 'cloud_logging' | 'stored' | string;
  logs: string | DeployLogEvent[];
  errorMessage?: string;
}

/** A single structured log event; present when `DeployLogs.source === "redis"`. */
export interface DeployLogEvent {
  stage: string;
  percent: number;
  message: string;
  deploymentId?: number;
  projectId?: number;
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

// ── Provision Database ──────────────────────────────────────

export interface ProvisionDbParams {
  /** The Fleeks project ID whose Cloud Run service will receive the env var. */
  projectId: number;
  /**
   * Database engine to provision.
   * Supported: `"postgresql"` | `"mysql"` | `"mongodb"` | `"redis"` |
   *            `"qdrant"` | `"neo4j"` | `"kafka"` | `"mariadb"`
   */
  dbType?: string;
  /** Deployment environment (default: `"production"`). */
  environment?: string;
  /** Custom env-var name injected into Cloud Run. Defaults to `DATABASE_URL`. */
  envVarName?: string;
}

/**
 * Result from `POST /sdk/deploy/provision-db`.
 *
 * For `postgresql`, the backend provisions on Cloud SQL (`10.18.0.3`).
 * For `redis`, it returns Memorystore Redis info (`10.17.182.43`).
 * Other engines fall back to the legacy in-cluster provisioner.
 *
 * All hosts are internal VPC addresses reachable only from your deployed
 * Cloud Run service (not from the public internet).
 */
export interface ProvisionDbResult {
  dbType?: string;
  connectionUrl?: string;
  /** Alias — Cloud SQL provisioner returns `database_url` */
  databaseUrl?: string;
  envVarName?: string;
  cloudRunService?: string;
  host?: string;
  dbName?: string;
  dbUser?: string;
  dbHost?: string;
  dbPort?: string;
  port?: number;
  message?: string;
}

// ── Mobile Distribution ─────────────────────────────────────

/** Parameters for distributing a mobile build via `POST /sdk/deploy/distribute/mobile`. */
export interface MobileDistributeParams {
  /** The Fleeks project ID. */
  projectId: number;
  /** Target platform: `"android"` or `"ios"`. */
  platform?: 'android' | 'ios' | string;
  /** Release version string (e.g. `"1.2.3"`). */
  version?: string;
  /**
   * The build artifact as a `Blob`, `File`, or `Buffer`.
   * Expected file types: `.apk`, `.aab`, `.ipa`.
   */
  artifact: Blob | File | Buffer | ArrayBuffer;
  /** Optional explicit filename (defaults to `artifact.name` when using `File`). */
  filename?: string;
}

/**
 * Result from `POST /sdk/deploy/distribute/mobile`.
 *
 * `downloadUrl` is a signed GCS URL valid for 7 days.
 * `qrCode` is a base64-encoded PNG of the QR code pointing to that URL.
 */
export interface MobileDistributeResult {
  downloadUrl: string;
  /** Base64-encoded PNG QR code image (prefix with `data:image/png;base64,` to embed). */
  qrCode: string;
  platform: string;
  gcsPath: string;
  expiresIn: string;
  filename: string;
  version: string;
}

// ── Desktop Distribution ────────────────────────────────────

/** Parameters for distributing desktop installers via `POST /sdk/deploy/distribute/desktop`. */
export interface DesktopDistributeParams {
  /** The Fleeks project ID. */
  projectId: number;
  /** Release version string. */
  version?: string;
  /** Windows installer (`.exe` / `.msi`) as a `Blob`, `File`, or `Buffer`. */
  windows?: Blob | File | Buffer | ArrayBuffer;
  windowsFilename?: string;
  /** macOS package (`.dmg` / `.pkg`) as a `Blob`, `File`, or `Buffer`. */
  macos?: Blob | File | Buffer | ArrayBuffer;
  macosFilename?: string;
  /** Linux package (`.AppImage` / `.deb` / `.rpm`) as a `Blob`, `File`, or `Buffer`. */
  linux?: Blob | File | Buffer | ArrayBuffer;
  linuxFilename?: string;
}

/**
 * Result from `POST /sdk/deploy/distribute/desktop`.
 *
 * `downloadUrls` maps OS key (`"windows"` | `"macos"` | `"linux"`) to a signed
 * GCS URL valid for 7 days. `landingPageUrl` is the public CDN URL of the
 * generated HTML download page at `https://downloads.fleeks.ai/{projectId}`.
 */
export interface DesktopDistributeResult {
  downloadUrls: Record<'windows' | 'macos' | 'linux' | string, string>;
  gcsPaths: Record<string, string>;
  landingPageUrl: string;
  expiresIn: string;
  version: string;
}

// ── Diagnose ────────────────────────────────────────────────

/**
 * Result from `POST /sdk/deploy/{id}/diagnose`.
 *
 * `patternsFound` lists named failure signatures (e.g. `"dependency_not_found"`).
 * `suggestedFixes` are actionable steps to resolve the failure.
 */
export interface DiagnoseResult {
  deploymentId: number;
  patternsFound: string[];
  diagnosis: string;
  suggestedFixes: string[];
  autoFixable: boolean;
}

// ── Health Check ────────────────────────────────────────────

/**
 * Result from `GET /sdk/deploy/{id}/health`.
 *
 * `status` is `"HEALTHY"` | `"DEGRADED"` | `"UNHEALTHY"`.
 * `urlCheck` contains HTTP probe details when the service has a URL.
 */
export interface HealthCheckResult {
  serviceName: string;
  url?: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | string;
  revisions: Record<string, unknown>[];
  traffic: Record<string, unknown>[];
  urlCheck?: Record<string, unknown>;
  message: string;
}

// ── Runtime Logs ────────────────────────────────────────────

export interface RuntimeLogEntry {
  timestamp?: string;
  severity: string;
  message: string;
}

/**
 * Result from `GET /sdk/deploy/{id}/runtime-logs`.
 *
 * Contains live container logs from Cloud Logging — distinct from the
 * build-time logs returned by `deploy.logs()`.
 */
export interface RuntimeLogsResult {
  deploymentId: number;
  serviceName: string;
  logs: RuntimeLogEntry[];
  count: number;
  errorCount: number;
  message: string;
}

export interface RuntimeLogsOptions {
  /** Minimum severity filter (default `"DEFAULT"`). */
  severity?: 'DEFAULT' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  /** Maximum number of log entries (1–200, default 50). */
  limit?: number;
}

// ── Metrics ─────────────────────────────────────────────────

export interface LatencyMetrics {
  p50?: number;
  p95?: number;
  p99?: number;
}

/**
 * Result from `GET /sdk/deploy/{id}/metrics`.
 *
 * Contains Cloud Run performance metrics over a configurable time window.
 */
export interface MetricsResult {
  deploymentId: number;
  serviceName: string;
  windowMinutes: number;
  requestCount?: number;
  errorRate?: number;
  latencyMs?: LatencyMetrics;
  instanceCount?: number;
  message: string;
}

export interface MetricsOptions {
  /** Lookback window in minutes (1–1440, default 60). */
  windowMinutes?: number;
}

// ── Multi-Service Deploy ────────────────────────────────────

export interface MultiDeployParams {
  /** The Fleeks project ID. */
  projectId: number;
  /** Target environment (default: `"staging"`). */
  environment?: string;
  /**
   * Optional `fleeks.yaml` content as a string.
   * If omitted, the manifest is read from the project's GCS workspace.
   */
  manifestYaml?: string;
}

export interface MultiServiceResult {
  deploymentId: number;
  url?: string;
  status: string;
}

/**
 * Result from `POST /sdk/deploy/multi`.
 *
 * `services` maps service name → individual deployment result.
 */
export interface MultiDeployResult {
  groupId: string;
  total: number;
  deployed: number;
  services: Record<string, MultiServiceResult>;
  message: string;
}

// ── Secrets Management ──────────────────────────────────────

export interface SecretsSetParams {
  /** The Fleeks project ID. */
  projectId: number;
  /** Key-value pairs to store in GCP Secret Manager. */
  secrets: Record<string, string>;
  /** Target environment (default: `"production"`). */
  environment?: string;
}

export interface SecretEntry {
  key: string;
  createdAt?: string;
}

export interface SecretsListResult {
  projectId: number;
  secrets: SecretEntry[];
  count: number;
}

export interface SecretsDeleteResult {
  success: boolean;
  message: string;
}
