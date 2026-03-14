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
  workspaceUrl?: string;
  containerId?: string;
  detectedTypes?: string[];
  activeSkills?: string[];
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
  skills?: string[];
}

export interface HandoffAgentOptions {
  task: string;
  localContext?: Record<string, unknown>;
  workspaceSnapshot?: Record<string, unknown>;
  conversationHistory?: unknown[];
  agentType?: AgentType;
  skills?: string[];
}

export interface StopAgentResponse {
  agentId: string;
  status: string;
  message: string;
  handoffId?: string;
}

export interface ListAgentsOptions {
  page?: number;
  pageSize?: number;
  statusFilter?: string;
}


// ============================================================================
// SUB-AGENT TYPES
// ============================================================================

export interface SubAgentUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface RunSubAgentOptions {
  /** The task prompt for the sub-agent (natural language). */
  prompt: string;
  /** Short label for logging/tracking (3-7 words). */
  description?: string;
  /** AI model to use ("auto" picks best available). */
  model?: string;
  /** Optional ID to link with parent agent session. */
  parentSessionId?: string;
  /** Optional context dictionary for the sub-agent. */
  context?: Record<string, unknown>;
  /** Max response tokens (default: 16384). */
  maxTokens?: number;
  /** Number of iterations (default: 1). */
  maxIterations?: number;
  /** Optional system prompt override. */
  system?: string;
  /** Sampling temperature (0.0 = deterministic). */
  temperature?: number;
}

export interface SubAgentResult {
  result: string;
  description: string;
  subagentId: string;
  parentSessionId?: string;
  usage?: SubAgentUsage;
  model: string;
  iterationsUsed: number;
  error?: string;
}
