import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient } from '../../src/client';
import { ContainerManager } from '../../src/managers/containers';

describe('ContainerManager', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';
  let client: FleeksClient;
  let containers: ContainerManager;

  beforeEach(() => {
    client = new FleeksClient({ apiKey: VALID_API_KEY });
    containers = new ContainerManager(client, 'test-project', 'container-abc');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInfo', () => {
    it('should get container info', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          container_id: 'container-abc',
          project_id: 'test-project',
          template: 'python',
          status: 'running',
        }),
      });

      const info = await containers.getInfo();
      expect(info.containerId).toBe('container-abc');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/containers/container-abc/info/'),
        expect.any(Object)
      );
    });
  });

  describe('getStats', () => {
    it('should get container stats', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          container_id: 'container-abc',
          cpu_percent: 25.5,
          memory_mb: 512,
          memory_percent: 50.0,
        }),
      });

      const stats = await containers.getStats();
      expect(stats.cpuPercent).toBe(25.5);
    });
  });

  describe('exec', () => {
    it('should execute a command in the container', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          container_id: 'container-abc',
          command: 'ls',
          exit_code: 0,
          stdout: 'file1.py\nfile2.py\n',
          stderr: '',
          execution_time_ms: 50,
        }),
      });

      const result = await containers.exec('ls');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('file1.py');
    });
  });

  describe('restart', () => {
    it('should restart the container', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'restarting' }),
      });

      const result = await containers.restart();
      expect(result.status).toBe('restarting');
    });
  });

  describe('lifecycle operations', () => {
    it('should send heartbeat', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          container_id: 'container-abc',
          status: 'alive',
          message: 'Heartbeat received',
        }),
      });

      const response = await containers.heartbeat();
      expect(response.status).toBe('alive');
    });

    it('should extend timeout', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          container_id: 'container-abc',
          success: true,
          added_minutes: 30,
          message: 'Timeout extended',
        }),
      });

      const response = await containers.extendTimeout(30);
      expect(response.success).toBe(true);
    });

    it('should hibernate', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          container_id: 'container-abc',
          status: 'hibernating',
          action: 'hibernate',
          message: 'Container hibernating',
        }),
      });

      const response = await containers.hibernate();
      expect(response.status).toBe('hibernating');
    });

    it('should wake', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          container_id: 'container-abc',
          status: 'running',
          action: 'wake',
          estimated_resume_seconds: 5,
          message: 'Container waking up',
        }),
      });

      const response = await containers.wake();
      expect(response.status).toBe('running');
    });
  });
});
