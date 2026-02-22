/**
 * @fleeks-ai/sdk — TypeScript/JavaScript SDK for the Fleeks AI Development Platform
 *
 * @example
 * ```typescript
 * import { FleeksClient } from '@fleeks-ai/sdk';
 *
 * const client = new FleeksClient({ apiKey: 'fleeks_...' });
 * const workspace = await client.workspaces.create({ projectId: 'my-project' });
 * await workspace.files.create('hello.py', 'print("Hello!")');
 * const result = await workspace.terminal.execute('python hello.py');
 * console.log(result.stdout);
 * await client.close();
 * ```
 */

// ── Core ────────────────────────────────────────────────────
export { FleeksClient, createClient } from './client';
export type { FleeksConfig } from './config';
export { DEFAULT_CONFIG } from './config';
export { SDK_VERSION } from './version';

// ── Authentication ──────────────────────────────────────────
export { validateApiKey, getAuthHeaders } from './auth';

// ── HTTP ────────────────────────────────────────────────────
export { HttpClient } from './http';
export type { RequestOptions } from './http';

// ── Errors ──────────────────────────────────────────────────
export {
  FleeksError,
  FleeksAPIError,
  FleeksRateLimitError,
  FleeksAuthenticationError,
  FleeksPermissionError,
  FleeksResourceNotFoundError,
  FleeksValidationError,
  FleeksConnectionError,
  FleeksStreamingError,
  FleeksTimeoutError,
} from './errors';

// ── Managers ────────────────────────────────────────────────
export { WorkspaceManager, Workspace } from './managers/workspaces';
export { FileManager } from './managers/files';
export { TerminalManager } from './managers/terminal';
export { ContainerManager } from './managers/containers';
export { AgentManager } from './managers/agents';
export { EmbedManager, Embed } from './managers/embeds';
export { DeployManager } from './managers/deploy';
export { StreamingClient } from './managers/streaming';

// ── Types: Workspace ────────────────────────────────────────
export type {
  WorkspaceInfo,
  WorkspaceHealth,
  PreviewURLInfo,
  CreateWorkspaceOptions,
  ListWorkspacesOptions,
} from './types/workspace';

// ── Types: Container ────────────────────────────────────────
export type {
  ContainerInfo,
  ContainerStats,
  ContainerProcess,
  ContainerProcessList,
  ContainerExecResult,
  ContainerExecOptions,
} from './types/container';

// ── Types: File ─────────────────────────────────────────────
export type {
  FileInfo,
  DirectoryListing,
  CreateFileOptions,
  UpdateFileOptions,
  ListFilesOptions,
  MkdirOptions,
  UploadFileOptions,
} from './types/file';

// ── Types: Terminal ─────────────────────────────────────────
export type {
  TerminalJob,
  TerminalJobList,
  ExecuteOptions,
  BackgroundJobOptions,
  WaitForJobOptions,
} from './types/terminal';

// ── Types: Agent ────────────────────────────────────────────
export { AgentType } from './types/agent';
export type {
  AgentExecution,
  AgentHandoff,
  AgentStatusInfo,
  AgentOutput,
  AgentList,
  ExecuteAgentOptions,
  HandoffAgentOptions,
  ListAgentsOptions,
} from './types/agent';

// ── Types: Embed ────────────────────────────────────────────
export {
  EmbedTemplate,
  DisplayMode,
  EmbedLayoutPreset,
  EmbedTheme,
  EmbedStatus,
} from './types/embed';
export type {
  EmbedInfo,
  CreateEmbedOptions,
  UpdateEmbedOptions,
  ListEmbedsOptions,
  EmbedSession,
  EmbedAnalytics,
  EmbedStatusChangeResponse,
} from './types/embed';

// ── Types: Lifecycle ────────────────────────────────────────
export {
  IdleAction,
  LifecycleState,
  LifecyclePresets,
  TIER_LIMITS,
} from './types/lifecycle';
export type {
  LifecycleConfig,
  HeartbeatResponse,
  TimeoutExtensionResponse,
  KeepAliveResponse,
  HibernationResponse,
  LifecycleStatusResponse,
  TierLimit,
} from './types/lifecycle';

// ── Types: Streaming ────────────────────────────────────────
export type {
  FileChangeEvent,
  AgentStreamEvent,
  TerminalStreamEvent,
  StreamError,
  WatchFilesOptions,
  StreamAgentOptions,
  StreamTerminalOptions,
  ActiveStreams,
} from './types/streaming';

// ── Types: Common ───────────────────────────────────────────
export type { PaginatedResponse, ApiResponse } from './types/common';

// ── Types: Deploy ───────────────────────────────────────────
export { DeploymentStatusEnum, DeployStatusResult } from './types/deploy';
export type {
  DeployCreateParams,
  DeployResponse,
  DeployStatus,
  DeployLogs,
  DeployRollbackResult,
  DeployDeleteResult,
  DeployListItem,
  DeployListOptions,
} from './types/deploy';

// ── Utilities ───────────────────────────────────────────────
export { toCamelCase, toSnakeCase } from './utils/case';
export { normalizeUrl } from './utils/url';
