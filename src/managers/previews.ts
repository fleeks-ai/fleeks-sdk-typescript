/**
 * Preview session manager — start, list, stop, refresh, health, detect.
 *
 * Matches backend:
 *   POST   /api/v1/preview/sessions
 *   GET    /api/v1/preview/sessions/project/{id}
 *   DELETE /api/v1/preview/sessions/{id}
 *   POST   /api/v1/preview/sessions/{id}/refresh
 *   GET    /api/v1/preview/sessions/{id}/health
 *   GET    /api/v1/preview/sessions/detect/{containerId}
 */

import type { FleeksClient } from '../client';
import type {
  PreviewSession,
  StartPreviewOptions,
  PreviewHealthStatus,
  DetectedServer,
} from '../types/preview';

const PREVIEW_PREFIX = 'api/v1';

export class PreviewManager {
  private client: FleeksClient;

  constructor(client: FleeksClient) {
    this.client = client;
  }

  /**
   * Start a new preview session for a project.
   *
   * @example
   * ```ts
   * const session = await client.previews.start({
   *   projectId: 42,
   *   port: 3000,
   *   framework: 'react_vite',
   * });
   * console.log(session.previewUrl);
   * ```
   */
  async start(options: StartPreviewOptions): Promise<PreviewSession> {
    return this.client.httpClient.request<PreviewSession>(
      'POST',
      'preview/sessions',
      {
        body: {
          projectId: options.projectId,
          ...(options.port !== undefined && { port: options.port }),
          ...(options.framework !== undefined && { framework: options.framework }),
        },
        prefixOverride: PREVIEW_PREFIX,
      },
    );
  }

  /**
   * List all preview sessions for a project.
   *
   * @example
   * ```ts
   * const sessions = await client.previews.list(42);
   * for (const s of sessions) {
   *   console.log(`${s.id} — ${s.status} on port ${s.port}`);
   * }
   * ```
   */
  async list(projectId: number): Promise<PreviewSession[]> {
    const resp = await this.client.httpClient.request<{ sessions: PreviewSession[] }>(
      'GET',
      `preview/sessions/project/${projectId}`,
      { prefixOverride: PREVIEW_PREFIX },
    );
    return resp.sessions ?? (resp as unknown as PreviewSession[]);
  }

  /**
   * Stop a running preview session.
   *
   * @example
   * ```ts
   * await client.previews.stop('prev_abc123');
   * ```
   */
  async stop(sessionId: string): Promise<{ status: string }> {
    return this.client.httpClient.request<{ status: string }>(
      'DELETE',
      `preview/sessions/${sessionId}`,
      { prefixOverride: PREVIEW_PREFIX },
    );
  }

  /**
   * Trigger a page refresh for a live preview session.
   *
   * @example
   * ```ts
   * await client.previews.refresh('prev_abc123');
   * ```
   */
  async refresh(sessionId: string): Promise<{ status: string }> {
    return this.client.httpClient.request<{ status: string }>(
      'POST',
      `preview/sessions/${sessionId}/refresh`,
      { prefixOverride: PREVIEW_PREFIX },
    );
  }

  /**
   * Check the health of a preview session.
   *
   * @example
   * ```ts
   * const health = await client.previews.health('prev_abc123');
   * if (!health.healthy) console.warn('Preview unhealthy:', health.status);
   * ```
   */
  async health(sessionId: string): Promise<PreviewHealthStatus> {
    return this.client.httpClient.request<PreviewHealthStatus>(
      'GET',
      `preview/sessions/${sessionId}/health`,
      { prefixOverride: PREVIEW_PREFIX },
    );
  }

  /**
   * Detect running dev servers inside a container.
   *
   * @example
   * ```ts
   * const servers = await client.previews.detect('ctr-abc123');
   * for (const srv of servers) {
   *   console.log(`Found ${srv.framework} on port ${srv.port} (${srv.confidence * 100}%)`);
   * }
   * ```
   */
  async detect(containerId: string): Promise<DetectedServer[]> {
    const resp = await this.client.httpClient.request<{ servers: DetectedServer[] }>(
      'GET',
      `preview/sessions/detect/${containerId}`,
      { prefixOverride: PREVIEW_PREFIX },
    );
    return resp.servers ?? (resp as unknown as DetectedServer[]);
  }
}
