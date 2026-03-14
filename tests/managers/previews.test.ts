import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient } from '../../src/client';
import { PreviewManager } from '../../src/managers/previews';

describe('PreviewManager', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';
  let client: FleeksClient;

  beforeEach(() => {
    client = new FleeksClient({ apiKey: VALID_API_KEY });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSession = {
    id: 'prev_abc123',
    project_id: 42,
    container_id: 'ctr-def456',
    port: 3000,
    framework: 'react_vite',
    status: 'running',
    preview_url: 'https://preview-abc123.fleeks.ai',
    started_at: '2026-03-10T12:00:00Z',
    last_activity_at: '2026-03-10T12:05:00Z',
    stopped_at: null,
  };

  describe('accessor', () => {
    it('should be accessible via client.previews', () => {
      expect(client.previews).toBeInstanceOf(PreviewManager);
    });

    it('should return the same instance on repeated access', () => {
      const first = client.previews;
      const second = client.previews;
      expect(first).toBe(second);
    });
  });

  describe('start', () => {
    it('should start a preview session', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSession),
      });

      const session = await client.previews.start({
        projectId: 42,
        port: 3000,
        framework: 'react_vite',
      });

      expect(session.id).toBe('prev_abc123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/preview/sessions'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should start with minimal options', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSession),
      });

      const session = await client.previews.start({ projectId: 42 });
      expect(session.id).toBe('prev_abc123');
    });
  });

  describe('list', () => {
    it('should list preview sessions for a project', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ sessions: [mockSession] }),
      });

      const sessions = await client.previews.list(42);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('prev_abc123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/preview/sessions/project/42'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should handle empty sessions list', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ sessions: [] }),
      });

      const sessions = await client.previews.list(42);
      expect(sessions).toHaveLength(0);
    });
  });

  describe('stop', () => {
    it('should stop a preview session', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'stopped' }),
      });

      const result = await client.previews.stop('prev_abc123');
      expect(result.status).toBe('stopped');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/preview/sessions/prev_abc123'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('refresh', () => {
    it('should refresh a preview session', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'refreshed' }),
      });

      const result = await client.previews.refresh('prev_abc123');
      expect(result.status).toBe('refreshed');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/preview/sessions/prev_abc123/refresh'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('health', () => {
    it('should check preview health', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          healthy: true,
          status: 'running',
          last_check: '2026-03-10T12:05:00Z',
        }),
      });

      const health = await client.previews.health('prev_abc123');
      expect(health.healthy).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/preview/sessions/prev_abc123/health'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should report unhealthy status', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          healthy: false,
          status: 'unhealthy',
          last_check: '2026-03-10T12:05:00Z',
        }),
      });

      const health = await client.previews.health('prev_abc123');
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('unhealthy');
    });
  });

  describe('detect', () => {
    it('should detect running dev servers in a container', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          servers: [
            { port: 3000, framework: 'react_vite', confidence: 0.95, command: 'vite' },
            { port: 8080, framework: 'express', confidence: 0.8, command: 'node server.js' },
          ],
        }),
      });

      const servers = await client.previews.detect('ctr-def456');
      expect(servers).toHaveLength(2);
      expect(servers[0].port).toBe(3000);
      expect(servers[0].framework).toBe('react_vite');
      expect(servers[0].confidence).toBe(0.95);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/preview/sessions/detect/ctr-def456'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return empty array when no servers detected', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ servers: [] }),
      });

      const servers = await client.previews.detect('ctr-empty');
      expect(servers).toHaveLength(0);
    });
  });
});
