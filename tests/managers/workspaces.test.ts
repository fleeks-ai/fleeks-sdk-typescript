import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient } from '../../src/client';
import { Workspace } from '../../src/managers/workspaces';

describe('WorkspaceManager', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';
  let client: FleeksClient;

  beforeEach(() => {
    client = new FleeksClient({ apiKey: VALID_API_KEY });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWorkspaceResponse = {
    project_id: 'test-project',
    container_id: 'container-abc',
    template: 'python',
    status: 'ready',
    created_at: '2025-01-01T00:00:00Z',
    languages: ['python'],
    resource_limits: {},
    preview_url: 'https://preview.fleeks.ai/test-project',
    websocket_url: 'wss://ws.fleeks.ai/test-project',
  };

  describe('create', () => {
    it('should create a workspace and return Workspace instance', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockWorkspaceResponse),
      });

      const workspace = await client.workspaces.create({
        projectId: 'test-project',
        template: 'python',
      });

      expect(workspace).toBeInstanceOf(Workspace);
      expect(workspace.projectId).toBe('test-project');
      expect(workspace.containerId).toBe('container-abc');
      expect(workspace.previewUrl).toBe('https://preview.fleeks.ai/test-project');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/workspaces/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('get', () => {
    it('should get a workspace by ID', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockWorkspaceResponse),
      });

      const workspace = await client.workspaces.get('test-project');

      expect(workspace).toBeInstanceOf(Workspace);
      expect(workspace.projectId).toBe('test-project');
    });
  });

  describe('list', () => {
    it('should list workspaces', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([mockWorkspaceResponse]),
      });

      const workspaces = await client.workspaces.list();

      expect(workspaces).toHaveLength(1);
      expect(workspaces[0]).toBeInstanceOf(Workspace);
    });
  });

  describe('delete', () => {
    it('should delete a workspace', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await client.workspaces.delete('test-project');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/workspaces/test-project/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Workspace instance', () => {
    it('should have scoped sub-managers', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockWorkspaceResponse),
      });

      const workspace = await client.workspaces.get('test-project');

      expect(workspace.files).toBeDefined();
      expect(workspace.terminal).toBeDefined();
      expect(workspace.containers).toBeDefined();
      expect(workspace.agents).toBeDefined();
    });

    it('should call health endpoint', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockWorkspaceResponse),
      });

      const workspace = await client.workspaces.get('test-project');

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy', project_id: 'test-project' }),
      });

      const health = await workspace.getHealth();
      expect(health.status).toBe('healthy');
    });
  });
});
