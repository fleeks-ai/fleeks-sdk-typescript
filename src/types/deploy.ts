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
 * `host` ends in `.svc.cluster.local` — it is an internal address reachable
 * only from inside the GKE VPC (i.e. from your deployed Cloud Run service).
 */
export interface ProvisionDbResult {
  dbType: string;
  connectionUrl: string;
  envVarName: string;
  cloudRunService: string;
  host: string;
  port: number;
  message: string;
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
