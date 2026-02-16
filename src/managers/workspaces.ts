import type { FleeksClient } from '../client';
import { FileManager } from './files';
import { TerminalManager } from './terminal';
import { ContainerManager } from './containers';
import { AgentManager } from './agents';
import type {
  WorkspaceInfo,
  WorkspaceHealth,
  PreviewURLInfo,
  CreateWorkspaceOptions,
  ListWorkspacesOptions,
} from '../types/workspace';

/**
 * A Workspace instance scoped to a specific project, providing
 * access to files, terminal, containers, and agents managers.
 */
export class Workspace {
  readonly projectId: string;
  readonly containerId: string;
  readonly info: WorkspaceInfo;
  readonly previewUrl: string | null;
  readonly websocketUrl: string | null;

  /** Scoped file operations */
  readonly files: FileManager;
  /** Scoped terminal operations */
  readonly terminal: TerminalManager;
  /** Scoped container operations */
  readonly containers: ContainerManager;
  /** Scoped agent operations */
  readonly agents: AgentManager;

  private client: FleeksClient;

  constructor(client: FleeksClient, info: WorkspaceInfo) {
    this.client = client;
    this.info = info;
    this.projectId = info.projectId;
    this.containerId = info.containerId;
    this.previewUrl = info.previewUrl ?? null;
    this.websocketUrl = info.websocketUrl ?? null;

    // Create scoped managers
    this.files = new FileManager(client, this.projectId);
    this.terminal = new TerminalManager(client, this.projectId);
    this.containers = new ContainerManager(client, this.projectId, this.containerId);
    this.agents = new AgentManager(client, this.projectId);
  }

  /**
   * Refresh workspace info from the API.
   */
  async getInfo(): Promise<WorkspaceInfo> {
    return this.client.get<WorkspaceInfo>(`workspaces/${this.projectId}`);
  }

  /**
   * Get workspace health status.
   */
  async getHealth(): Promise<WorkspaceHealth> {
    return this.client.get<WorkspaceHealth>(`workspaces/${this.projectId}/health`);
  }

  /**
   * Get the workspace preview URL info.
   */
  async getPreviewUrl(): Promise<PreviewURLInfo> {
    return this.client.get<PreviewURLInfo>(`workspaces/${this.projectId}/preview-url`);
  }

  /**
   * Delete this workspace.
   */
  async delete(): Promise<void> {
    await this.client.delete(`workspaces/${this.projectId}`);
  }
}

/**
 * Manages workspace CRUD operations.
 */
export class WorkspaceManager {
  private client: FleeksClient;

  constructor(client: FleeksClient) {
    this.client = client;
  }

  /**
   * Create a new workspace.
   * @param options Workspace creation options
   */
  async create(options: CreateWorkspaceOptions): Promise<Workspace> {
    const data = await this.client.post<WorkspaceInfo>('workspaces', {
      projectId: options.projectId,
      template: options.template ?? 'default',
      ...(options.pinnedVersions && { pinnedVersions: options.pinnedVersions }),
    });
    return new Workspace(this.client, data);
  }

  /**
   * Get an existing workspace by project ID.
   * @param projectId Project identifier
   */
  async get(projectId: string): Promise<Workspace> {
    const data = await this.client.get<WorkspaceInfo>(`workspaces/${projectId}`);
    return new Workspace(this.client, data);
  }

  /**
   * List all workspaces.
   * @param options List options
   */
  async list(options?: ListWorkspacesOptions): Promise<Workspace[]> {
    const params: Record<string, string> = {};
    if (options?.page !== undefined) params.page = String(options.page);
    if (options?.pageSize !== undefined) params.page_size = String(options.pageSize);
    if (options?.statusFilter) params.status = options.statusFilter;

    const data = await this.client.get<WorkspaceInfo[]>('workspaces', params);
    const items = Array.isArray(data) ? data : (data as unknown as { results: WorkspaceInfo[] }).results ?? [];
    return items.map(info => new Workspace(this.client, info));
  }

  /**
   * Delete a workspace by project ID.
   * @param projectId Project identifier
   */
  async delete(projectId: string): Promise<void> {
    await this.client.delete(`workspaces/${projectId}`);
  }
}
