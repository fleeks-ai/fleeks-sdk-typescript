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
