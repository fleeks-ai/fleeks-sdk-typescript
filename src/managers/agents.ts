import type { FleeksClient } from '../client';
import type {
  AgentExecution,
  AgentHandoff,
  AgentStatusInfo,
  AgentOutput,
  AgentList,
  ExecuteAgentOptions,
  HandoffAgentOptions,
  ListAgentsOptions,
} from '../types/agent';
import { AgentType } from '../types/agent';

export class AgentManager {
  private client: FleeksClient;
  private projectId: string;

  constructor(client: FleeksClient, projectId: string) {
    this.client = client;
    this.projectId = projectId;
  }

  /**
   * Execute an AI agent task.
   * @param options Agent execution options
   */
  async execute(options: ExecuteAgentOptions): Promise<AgentExecution> {
    return this.client.post<AgentExecution>('agents', {
      projectId: this.projectId,
      task: options.task,
      agentType: options.agentType ?? AgentType.AUTO,
      ...(options.context && { context: options.context }),
      maxIterations: options.maxIterations ?? 10,
      autoApprove: options.autoApprove ?? false,
    });
  }

  /**
   * Handoff a task to an agent with context.
   * @param options Handoff options
   */
  async handoff(options: HandoffAgentOptions): Promise<AgentHandoff> {
    return this.client.post<AgentHandoff>('agents/handoff', {
      projectId: this.projectId,
      task: options.task,
      ...(options.localContext && { localContext: options.localContext }),
      ...(options.workspaceSnapshot && { workspaceSnapshot: options.workspaceSnapshot }),
      ...(options.conversationHistory && { conversationHistory: options.conversationHistory }),
      ...(options.agentType && { agentType: options.agentType }),
    });
  }

  /**
   * Get an agent's current status.
   * @param agentId Agent identifier
   */
  async getStatus(agentId: string): Promise<AgentStatusInfo> {
    return this.client.get<AgentStatusInfo>(`agents/${agentId}`);
  }

  /**
   * Get an agent's output and results.
   * @param agentId Agent identifier
   */
  async getOutput(agentId: string): Promise<AgentOutput> {
    return this.client.get<AgentOutput>(`agents/${agentId}/output`);
  }

  /**
   * List agents for this workspace.
   * @param options List options
   */
  async list(options?: ListAgentsOptions): Promise<AgentList> {
    const params: Record<string, string> = { project_id: this.projectId };
    if (options?.page !== undefined) params.page = String(options.page);
    if (options?.pageSize !== undefined) params.page_size = String(options.pageSize);
    if (options?.statusFilter) params.status = options.statusFilter;

    return this.client.get<AgentList>('agents', params);
  }

  /**
   * Stop a running agent.
   * @param agentId Agent identifier
   */
  async stop(agentId: string): Promise<void> {
    await this.client.delete(`agents/${agentId}`);
  }
}
