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
        expect.stringContaining('/api/v1/sdk/agents'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should pass skills option when provided', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          agent_id: 'agent-skill',
          project_id: 'test-project',
          task: 'build app',
          status: 'running',
          started_at: '2025-01-01T00:00:00Z',
          message: 'Agent started with skills',
        }),
      });

      const execution = await agents.execute({
        task: 'build app',
        agentType: AgentType.CODE,
        skills: ['typescript', 'react'],
      });

      expect(execution.agentId).toBe('agent-skill');
      const callBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.skills).toEqual(['typescript', 'react']);
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

    it('should return new handoff fields when present', async () => {
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
          workspace_url: 'https://workspace.fleeks.ai/w/abc',
          container_id: 'ctr-xyz',
          detected_types: ['typescript', 'react'],
          active_skills: ['lint', 'test'],
        }),
      });

      const handoff = await agents.handoff({
        task: 'continue work',
        localContext: {},
        skills: ['lint', 'test'],
      });

      expect(handoff.workspaceUrl).toBe('https://workspace.fleeks.ai/w/abc');
      expect(handoff.containerId).toBe('ctr-xyz');
      expect(handoff.detectedTypes).toEqual(['typescript', 'react']);
      expect(handoff.activeSkills).toEqual(['lint', 'test']);
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
        status: 200,
        json: () => Promise.resolve({
          agent_id: 'agent-123',
          status: 'stopped',
          message: 'Agent stopped successfully',
          handoff_id: 'handoff-999',
        }),
      });

      const result = await agents.stop('agent-123');

      expect(result.agentId).toBe('agent-123');
      expect(result.status).toBe('stopped');
      expect(result.message).toBe('Agent stopped successfully');
      expect(result.handoffId).toBe('handoff-999');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/agents/agent-123/stop'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
