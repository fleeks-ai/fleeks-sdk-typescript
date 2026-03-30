/**
 * DeployManager — Fleeks SDK deployment lifecycle management.
 *
 * All methods route through the parent FleeksClient's HttpClient,
 * which prepends ``/api/v1/sdk/`` to each endpoint automatically.
 */

import type { FleeksClient } from '../client';
import {
  DeployStatusResult,
} from '../types/deploy';
import type {
  DeployCreateParams,
  DeployResponse,
  DeployStatus,
  DeployLogs,
  DeployRollbackResult,
  DeployDeleteResult,
  DeployListItem,
  DeployListOptions,
  ProvisionDbParams,
  ProvisionDbResult,
  MobileDistributeParams,
  MobileDistributeResult,
  DesktopDistributeParams,
  DesktopDistributeResult,
  DiagnoseResult,
  HealthCheckResult,
  RuntimeLogsResult,
  RuntimeLogsOptions,
  MetricsResult,
  MetricsOptions,
  MultiDeployParams,
  MultiDeployResult,
  SecretsSetParams,
  SecretsListResult,
  SecretsDeleteResult,
} from '../types/deploy';

export class DeployManager {
  constructor(private client: FleeksClient) {}

  /**
   * Initiate a new deployment.
   *
   * @param params - Deployment parameters (projectId, environment, envVars).
   * @returns DeployResponse with deployment_id and initial status.
   */
  async create(params: DeployCreateParams): Promise<DeployResponse> {
    return this.client.post<DeployResponse>('deploy', {
      project_id: params.projectId,
      environment: params.environment ?? 'production',
      env_vars: params.envVars,
    });
  }

  /**
   * Get the current status of a deployment.
   * Returns a DeployStatusResult with convenience getters (isRunning, isSucceeded, isFailed).
   */
  async status(deploymentId: number): Promise<DeployStatusResult> {
    const data = await this.client.get<DeployStatus>(`deploy/${deploymentId}`);
    return new DeployStatusResult(data);
  }

  /**
   * Get deployment build/runtime logs.
   */
  async logs(deploymentId: number): Promise<DeployLogs> {
    return this.client.get<DeployLogs>(`deploy/${deploymentId}/logs`);
  }

  /**
   * Stream real-time deployment logs via Server-Sent Events.
   *
   * @param deploymentId - The deployment ID.
   * @param onEvent - Callback invoked for each SSE event payload.
   * @param options - Optional AbortSignal to cancel the stream.
   *
   * @example
   * ```ts
   * await client.deploy.streamLogs(42, (event) => {
   *   console.log(`[${event.stage}] ${event.message}`);
   * });
   * ```
   */
  async streamLogs(
    deploymentId: number,
    onEvent: (event: Record<string, unknown>) => void,
    options?: { signal?: AbortSignal }
  ): Promise<void> {
    const url = this.client.httpClient.buildUrl(
      `deploy/${deploymentId}/logs/stream`
    );
    const headers = this.client.httpClient.getRequestHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Stream request failed: ${response.status} ${response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            try {
              onEvent(JSON.parse(raw));
            } catch {
              onEvent({ raw });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Provision a database for a deployed Cloud Run service.
   *
   * Creates a logical database on the in-cluster DB server and injects the
   * connection URL as an environment variable on the target Cloud Run service.
   *
   * Supported `dbType` values: `"postgresql"`, `"mysql"`, `"mongodb"`,
   * `"redis"`, `"qdrant"`, `"neo4j"`, `"kafka"`, `"mariadb"`.
   *
   * @example
   * ```ts
   * const db = await client.deploy.provisionDb({
   *   projectId: 42,
   *   dbType: 'postgresql',
   * });
   * console.log(db.connectionUrl);
   * ```
   */
  async provisionDb(params: ProvisionDbParams): Promise<ProvisionDbResult> {
    return this.client.post<ProvisionDbResult>('deploy/provision-db', {
      project_id: params.projectId,
      db_type: params.dbType ?? 'postgresql',
      environment: params.environment ?? 'production',
      ...(params.envVarName ? { env_var_name: params.envVarName } : {}),
    });
  }

  /**
   * Upload a mobile build artifact to GCS and get a download link + QR code.
   *
   * The signed URL is valid for 7 days. `result.qrCode` is a base64-encoded
   * PNG — prefix it with `data:image/png;base64,` to embed in HTML/React.
   *
   * @example
   * ```ts
   * const fileInput = document.querySelector<HTMLInputElement>('#apk')!;
   * const result = await client.deploy.distributeMobile({
   *   projectId: 42,
   *   platform: 'android',
   *   version: '1.0.0',
   *   artifact: fileInput.files![0],
   * });
   * console.log(result.downloadUrl);
   * ```
   */
  async distributeMobile(
    params: MobileDistributeParams
  ): Promise<MobileDistributeResult> {
    const form = new FormData();
    const filename =
      params.filename ??
      (params.artifact instanceof File ? params.artifact.name : 'app.apk');
    form.append(
      'artifact',
      params.artifact instanceof Blob || params.artifact instanceof File
        ? params.artifact
        : new Blob([params.artifact]),
      filename
    );

    return this.client.httpClient.requestMultipart<MobileDistributeResult>(
      'POST',
      'deploy/distribute/mobile',
      form,
      {
        params: {
          project_id: String(params.projectId),
          platform: params.platform ?? 'android',
          version: params.version ?? '1.0.0',
        },
      }
    );
  }

  /**
   * Upload desktop installers to GCS and generate per-OS download links plus
   * a public HTML landing page at `https://downloads.fleeks.ai/{projectId}`.
   *
   * At least one of `windows`, `macos`, or `linux` must be provided.
   *
   * @example
   * ```ts
   * const result = await client.deploy.distributeDesktop({
   *   projectId: 42,
   *   version: '1.0.0',
   *   windows: windowsInstallerFile,
   *   macos: macDmgFile,
   * });
   * console.log(result.landingPageUrl);
   * ```
   */
  async distributeDesktop(
    params: DesktopDistributeParams
  ): Promise<DesktopDistributeResult> {
    if (!params.windows && !params.macos && !params.linux) {
      throw new Error(
        'At least one platform artifact (windows, macos, linux) must be provided.'
      );
    }

    const form = new FormData();
    const appendArtifact = (
      key: string,
      data: Blob | File | Buffer | ArrayBuffer | undefined,
      fallbackName: string,
      customName?: string
    ) => {
      if (!data) return;
      const name =
        customName ??
        (data instanceof File ? data.name : fallbackName);
      form.append(
        key,
        data instanceof Blob || data instanceof File
          ? data
          : new Blob([data]),
        name
      );
    };

    appendArtifact('windows', params.windows, 'installer.exe', params.windowsFilename);
    appendArtifact('macos', params.macos, 'app.dmg', params.macosFilename);
    appendArtifact('linux', params.linux, 'app.AppImage', params.linuxFilename);

    return this.client.httpClient.requestMultipart<DesktopDistributeResult>(
      'POST',
      'deploy/distribute/desktop',
      form,
      {
        params: {
          project_id: String(params.projectId),
          version: params.version ?? '1.0.0',
        },
      }
    );
  }

  /**
   * Rollback a deployment to the previous Cloud Run revision.
   */
  async rollback(deploymentId: number): Promise<DeployRollbackResult> {
    return this.client.post<DeployRollbackResult>(
      `deploy/${deploymentId}/rollback`
    );
  }

  /**
   * Delete a deployment and tear down all associated infrastructure.
   */
  async delete(deploymentId: number): Promise<DeployDeleteResult> {
    return this.client.delete<DeployDeleteResult>(`deploy/${deploymentId}`);
  }

  /**
   * List deployments for a project.
   *
   * @param projectId - The project ID.
   * @param options - Pagination options.
   * @returns Array of DeployListItem objects.
   */
  async list(
    projectId: number,
    options?: DeployListOptions
  ): Promise<DeployListItem[]> {
    const limit = options?.limit ?? 20;
    return this.client.get<DeployListItem[]>('deploy/list', {
      project_id: String(projectId),
      limit: String(limit),
    });
  }

  // ── Diagnose ────────────────────────────────────────────

  /**
   * Diagnose a failed deployment.
   *
   * Pattern-matches against 13 known failure signatures and returns an
   * actionable diagnosis with suggested fixes.
   *
   * @param deploymentId - The deployment ID to diagnose.
   */
  async diagnose(deploymentId: number): Promise<DiagnoseResult> {
    return this.client.post<DiagnoseResult>(
      `deploy/${deploymentId}/diagnose`
    );
  }

  // ── Health ──────────────────────────────────────────────

  /**
   * Check the health of a deployed Cloud Run service.
   *
   * Inspects revision conditions, traffic split, and URL reachability.
   * Returns `"HEALTHY"`, `"DEGRADED"`, or `"UNHEALTHY"`.
   *
   * @param deploymentId - The deployment ID to check.
   */
  async health(deploymentId: number): Promise<HealthCheckResult> {
    return this.client.get<HealthCheckResult>(
      `deploy/${deploymentId}/health`
    );
  }

  // ── Runtime Logs ────────────────────────────────────────

  /**
   * Fetch live runtime (container) logs from Cloud Logging.
   *
   * Different from `logs()` which returns build-time logs. Use this when
   * the app is deployed but crashing or returning errors.
   *
   * @param deploymentId - The deployment ID.
   * @param options - Severity filter and limit.
   */
  async runtimeLogs(
    deploymentId: number,
    options?: RuntimeLogsOptions
  ): Promise<RuntimeLogsResult> {
    return this.client.get<RuntimeLogsResult>(
      `deploy/${deploymentId}/runtime-logs`,
      {
        severity: options?.severity ?? 'DEFAULT',
        limit: String(options?.limit ?? 50),
      }
    );
  }

  // ── Metrics ─────────────────────────────────────────────

  /**
   * Fetch performance metrics for a deployed Cloud Run service.
   *
   * Returns request count, latency percentiles (p50/p95/p99), error rate,
   * and active instance count over the specified time window.
   *
   * @param deploymentId - The deployment ID.
   * @param options - Time window configuration.
   */
  async metrics(
    deploymentId: number,
    options?: MetricsOptions
  ): Promise<MetricsResult> {
    return this.client.get<MetricsResult>(
      `deploy/${deploymentId}/metrics`,
      {
        window_minutes: String(options?.windowMinutes ?? 60),
      }
    );
  }

  // ── Multi-Service Deploy ────────────────────────────────

  /**
   * Deploy a multi-service project from a `fleeks.yaml` manifest.
   *
   * Each service gets its own Cloud Run instance with auto-injected
   * service-to-service URLs. Tier limits apply.
   *
   * @param params - Project ID, environment, and optional manifest YAML.
   */
  async multiDeploy(params: MultiDeployParams): Promise<MultiDeployResult> {
    return this.client.post<MultiDeployResult>('deploy/multi', {
      project_id: params.projectId,
      environment: params.environment ?? 'staging',
      ...(params.manifestYaml
        ? { manifest_yaml: params.manifestYaml }
        : {}),
    });
  }

  // ── Secrets Management ──────────────────────────────────

  /**
   * Set environment secrets for a project.
   *
   * Secrets are stored in GCP Secret Manager and auto-injected into
   * the project's Cloud Run service on the next deploy.
   */
  async setSecrets(params: SecretsSetParams): Promise<{ success: boolean; message: string }> {
    return this.client.post('deploy/secrets', {
      project_id: params.projectId,
      secrets: params.secrets,
      environment: params.environment ?? 'production',
    });
  }

  /**
   * List secret keys for a project (values are never exposed).
   */
  async listSecrets(projectId: number): Promise<SecretsListResult> {
    return this.client.get<SecretsListResult>(`deploy/secrets/${projectId}`);
  }

  /**
   * Delete all secrets for a project.
   */
  async deleteSecrets(projectId: number): Promise<SecretsDeleteResult> {
    return this.client.delete<SecretsDeleteResult>(`deploy/secrets/${projectId}`);
  }

  /**
   * Poll deployment status until it reaches a terminal state.
   *
   * @param deploymentId - The deployment to poll.
   * @param intervalMs - Polling interval in milliseconds (default 3000).
   * @param timeoutMs - Maximum wait time (default 600000 = 10 min).
   * @returns Final DeployStatus.
   */
  async waitForCompletion(
    deploymentId: number,
    intervalMs = 3000,
    timeoutMs = 600_000
  ): Promise<DeployStatusResult> {
    const start = Date.now();
    const terminalStates = new Set([
      'succeeded',
      'failed',
      'cancelled',
      'deleted',
    ]);

    while (Date.now() - start < timeoutMs) {
      const st = await this.status(deploymentId);
      if (terminalStates.has(st.status)) {
        return st;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(
      `Deployment #${deploymentId} did not complete within ${timeoutMs / 1000}s`
    );
  }
}
