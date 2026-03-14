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
