export enum AgentType {
  AUTO = 'auto',
  CODE = 'code',
  RESEARCH = 'research',
  DEBUG = 'debug',
  TEST = 'test',
}

export interface AgentExecution {
  agentId: string;
  projectId: string;
  task: string;
  status: string;
  startedAt: string;
  message: string;
}

export interface AgentHandoff {
  agentId: string;
  projectId: string;
  status: string;
  handoffId: string;
  workspaceSynced: boolean;
  contextPreserved: boolean;
  message: string;
}

export interface AgentStatusInfo {
  agentId: string;
  projectId: string;
  task: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;               // 0-100
  currentStep?: string;
  iterationsCompleted: number;
  maxIterations: number;
  startedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
}

export interface AgentOutput {
  agentId: string;
  projectId: string;
  task: string;
  filesModified: string[];
  filesCreated: string[];
  commandsExecuted: string[];
  reasoning: string[];
  errors: string[];
  executionTimeMs: number;
  iterationsCompleted: number;
}

export interface AgentList {
  projectId: string;
  totalCount: number;
  agents: AgentStatusInfo[];
}

export interface ExecuteAgentOptions {
  task: string;
  agentType?: AgentType;
  context?: Record<string, unknown>;
  maxIterations?: number;
  autoApprove?: boolean;
}

export interface HandoffAgentOptions {
  task: string;
  localContext?: Record<string, unknown>;
  workspaceSnapshot?: Record<string, unknown>;
  conversationHistory?: unknown[];
  agentType?: AgentType;
}

export interface ListAgentsOptions {
  page?: number;
  pageSize?: number;
  statusFilter?: string;
}
