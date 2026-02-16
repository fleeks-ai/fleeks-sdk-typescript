export interface WorkspaceInfo {
  projectId: string;
  containerId: string;
  template: string;
  status: string;
  createdAt: string;            // ISO 8601
  languages: string[];
  resourceLimits: Record<string, unknown>;
  previewUrl?: string;
  websocketUrl?: string;
}

export interface WorkspaceHealth {
  projectId: string;
  status: string;
  container: Record<string, unknown>;
  agents: Record<string, unknown>;
  lastActivity: string;
  uptimeSeconds: number;
}

export interface PreviewURLInfo {
  projectId: string;
  previewUrl: string;
  websocketUrl: string;
  status: string;
  containerId: string;
}

export interface CreateWorkspaceOptions {
  projectId: string;
  template?: string;
  pinnedVersions?: Record<string, string>;
}

export interface ListWorkspacesOptions {
  page?: number;
  pageSize?: number;
  statusFilter?: string;
}
