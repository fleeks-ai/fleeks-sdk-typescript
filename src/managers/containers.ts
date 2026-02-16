import type { FleeksClient } from '../client';
import type {
  ContainerInfo,
  ContainerStats,
  ContainerExecResult,
  ContainerProcessList,
  ContainerExecOptions,
} from '../types/container';
import type {
  HeartbeatResponse,
  TimeoutExtensionResponse,
  KeepAliveResponse,
  HibernationResponse,
  LifecycleStatusResponse,
  LifecycleConfig,
} from '../types/lifecycle';

export class ContainerManager {
  private client: FleeksClient;
  private containerId: string;

  constructor(client: FleeksClient, _projectId: string, containerId: string) {
    this.client = client;
    this.containerId = containerId;
  }

  // ── Core Container Operations ─────────────────────────────

  /**
   * Get container information.
   */
  async getInfo(): Promise<ContainerInfo> {
    return this.client.get<ContainerInfo>(`containers/${this.containerId}/info`);
  }

  /**
   * Get container resource statistics.
   */
  async getStats(): Promise<ContainerStats> {
    return this.client.get<ContainerStats>(`containers/${this.containerId}/stats`);
  }

  /**
   * Execute a command inside the container.
   * @param command Command to execute
   * @param options Execution options
   */
  async exec(command: string, options?: ContainerExecOptions): Promise<ContainerExecResult> {
    return this.client.post<ContainerExecResult>(`containers/${this.containerId}/exec`, {
      command,
      ...(options?.workingDir && { workingDir: options.workingDir }),
      ...(options?.timeoutSeconds !== undefined && { timeoutSeconds: options.timeoutSeconds }),
      ...(options?.environment && { environment: options.environment }),
    });
  }

  /**
   * List running processes in the container.
   */
  async getProcesses(): Promise<ContainerProcessList> {
    return this.client.get<ContainerProcessList>(`containers/${this.containerId}/processes`);
  }

  /**
   * Restart the container.
   */
  async restart(): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(`containers/${this.containerId}/restart`);
  }

  // ── Lifecycle Management ──────────────────────────────────

  /**
   * Send a heartbeat to keep the container alive.
   */
  async heartbeat(): Promise<HeartbeatResponse> {
    return this.client.post<HeartbeatResponse>(`containers/${this.containerId}/heartbeat`);
  }

  /**
   * Extend the container's idle timeout.
   * @param additionalMinutes Minutes to add
   */
  async extendTimeout(additionalMinutes?: number): Promise<TimeoutExtensionResponse> {
    return this.client.post<TimeoutExtensionResponse>(
      `containers/${this.containerId}/extend-timeout`,
      additionalMinutes !== undefined ? { additionalMinutes } : undefined
    );
  }

  /**
   * Enable or disable keep-alive for the container.
   * @param enabled Whether to enable keep-alive
   */
  async setKeepAlive(enabled?: boolean): Promise<KeepAliveResponse> {
    return this.client.post<KeepAliveResponse>(
      `containers/${this.containerId}/keep-alive`,
      enabled !== undefined ? { enabled } : undefined
    );
  }

  /**
   * Hibernate the container to save resources.
   */
  async hibernate(): Promise<HibernationResponse> {
    return this.client.post<HibernationResponse>(`containers/${this.containerId}/hibernate`);
  }

  /**
   * Wake a hibernated container.
   */
  async wake(): Promise<HibernationResponse> {
    return this.client.post<HibernationResponse>(`containers/${this.containerId}/wake`);
  }

  /**
   * Get the current lifecycle status.
   */
  async getLifecycleStatus(): Promise<LifecycleStatusResponse> {
    return this.client.get<LifecycleStatusResponse>(`containers/${this.containerId}/lifecycle`);
  }

  /**
   * Configure the container's lifecycle settings.
   * @param config Lifecycle configuration
   */
  async configureLifecycle(config: LifecycleConfig): Promise<LifecycleStatusResponse> {
    return this.client.put<LifecycleStatusResponse>(
      `containers/${this.containerId}/lifecycle`,
      config as unknown as Record<string, unknown>
    );
  }
}
