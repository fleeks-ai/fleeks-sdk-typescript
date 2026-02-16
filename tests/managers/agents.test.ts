import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient } from '../../src/client';
import { AgentManager } from '../../src/managers/agents';
import { AgentType } from '../../src/types/agent';

describe('AgentManager', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';
  let client: FleeksClient;
  let agents: AgentManager;

  beforeEach(() => {
    client = new FleeksClient({ apiKey: VALID_API_KEY });
    agents = new AgentManager(client, 'test-project');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute', () => {
    it('should execute an agent task', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          agent_id: 'agent-123',
          project_id: 'test-project',
          task: 'write tests',
          status: 'running',
          started_at: '2025-01-01T00:00:00Z',
          message: 'Agent started',
        }),
      });

      const execution = await agents.execute({
        task: 'write tests',
        agentType: AgentType.CODE,
      });

      expect(execution.agentId).toBe('agent-123');
      expect(execution.status).toBe('running');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/agents/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('handoff', () => {
    it('should handoff a task', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          agent_id: 'agent-456',
          project_id: 'test-project',
          status: 'running',
          handoff_id: 'handoff-789',
          workspace_synced: true,
          context_preserved: true,
          message: 'Handoff successful',
        }),
      });

      const handoff = await agents.handoff({
        task: 'continue debugging',
        localContext: { error: 'TypeError' },
      });

      expect(handoff.handoffId).toBe('handoff-789');
      expect(handoff.workspaceSynced).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should get agent status', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          agent_id: 'agent-123',
          project_id: 'test-project',
          task: 'write tests',
          status: 'completed',
          progress: 100,
          iterations_completed: 5,
          max_iterations: 10,
        }),
      });

      const status = await agents.getStatus('agent-123');
      expect(status.progress).toBe(100);
      expect(status.status).toBe('completed');
    });
  });

  describe('getOutput', () => {
    it('should get agent output', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          agent_id: 'agent-123',
          project_id: 'test-project',
          task: 'write tests',
          files_modified: ['test.py'],
          files_created: ['test_new.py'],
          commands_executed: ['python -m pytest'],
          reasoning: ['Created test file'],
          errors: [],
          execution_time_ms: 5000,
          iterations_completed: 3,
        }),
      });

      const output = await agents.getOutput('agent-123');
      expect(output.filesModified).toContain('test.py');
      expect(output.filesCreated).toContain('test_new.py');
    });
  });

  describe('stop', () => {
    it('should stop an agent', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await agents.stop('agent-123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/agents/agent-123/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
