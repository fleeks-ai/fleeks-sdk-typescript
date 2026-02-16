import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient } from '../../src/client';
import { TerminalManager } from '../../src/managers/terminal';

describe('TerminalManager', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';
  let client: FleeksClient;
  let terminal: TerminalManager;

  beforeEach(() => {
    client = new FleeksClient({ apiKey: VALID_API_KEY });
    terminal = new TerminalManager(client, 'test-project');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockJob = {
    job_id: 'job-123',
    project_id: 'test-project',
    command: 'echo hello',
    status: 'completed',
    exit_code: 0,
    stdout: 'hello\n',
    stderr: '',
    started_at: '2025-01-01T00:00:00Z',
    completed_at: '2025-01-01T00:00:01Z',
    execution_time_ms: 100,
  };

  describe('execute', () => {
    it('should execute a command', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockJob),
      });

      const job = await terminal.execute('echo hello');

      expect(job.stdout).toBe('hello\n');
      expect(job.status).toBe('completed');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/terminal/execute/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('startBackgroundJob', () => {
    it('should start a background job', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...mockJob, status: 'running' }),
      });

      const job = await terminal.startBackgroundJob('npm start');

      expect(job.status).toBe('running');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/terminal/background/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('getJob', () => {
    it('should get job status', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockJob),
      });

      const job = await terminal.getJob('job-123');
      expect(job.jobId).toBe('job-123');
    });
  });

  describe('listJobs', () => {
    it('should list jobs', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          project_id: 'test-project',
          total_count: 1,
          jobs: [mockJob],
        }),
      });

      const result = await terminal.listJobs();
      expect(result.totalCount).toBe(1);
    });
  });

  describe('stopJob', () => {
    it('should stop a job', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await terminal.stopJob('job-123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/terminal/jobs/job-123/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('waitForJob', () => {
    it('should poll until job completes', async () => {
      let callCount = 0;
      (fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        const status = callCount >= 2 ? 'completed' : 'running';
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ...mockJob, status }),
        });
      });

      const job = await terminal.waitForJob('job-123', { pollInterval: 10 });
      expect(job.status).toBe('completed');
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });
});
