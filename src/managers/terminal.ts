import type { FleeksClient } from '../client';
import type {
  TerminalJob,
  TerminalJobList,
  ExecuteOptions,
  BackgroundJobOptions,
  WaitForJobOptions,
} from '../types/terminal';
import { FleeksTimeoutError } from '../errors';

export class TerminalManager {
  private client: FleeksClient;
  private projectId: string;

  constructor(client: FleeksClient, projectId: string) {
    this.client = client;
    this.projectId = projectId;
  }

  /**
   * Execute a command and wait for completion.
   * @param command Command string to execute
   * @param options Execution options
   */
  async execute(command: string, options?: ExecuteOptions): Promise<TerminalJob> {
    return this.client.post<TerminalJob>('terminal/execute', {
      projectId: this.projectId,
      command,
      workingDir: options?.workingDir ?? '/workspace',
      ...(options?.environment && { environment: options.environment }),
      timeoutSeconds: options?.timeoutSeconds ?? 30,
    });
  }

  /**
   * Start a background job.
   * @param command Command string to execute
   * @param options Background job options
   */
  async startBackgroundJob(command: string, options?: BackgroundJobOptions): Promise<TerminalJob> {
    return this.client.post<TerminalJob>('terminal/background', {
      projectId: this.projectId,
      command,
      workingDir: options?.workingDir ?? '/workspace',
      ...(options?.environment && { environment: options.environment }),
    });
  }

  /**
   * Get a terminal job by ID.
   * @param jobId Job identifier
   */
  async getJob(jobId: string): Promise<TerminalJob> {
    return this.client.get<TerminalJob>(`terminal/jobs/${jobId}`);
  }

  /**
   * List terminal jobs.
   * @param statusFilter Optional status filter
   */
  async listJobs(statusFilter?: string): Promise<TerminalJobList> {
    const params: Record<string, string> = { project_id: this.projectId };
    if (statusFilter) params.status = statusFilter;

    return this.client.get<TerminalJobList>('terminal/jobs', params);
  }

  /**
   * Stop a running job.
   * @param jobId Job identifier
   */
  async stopJob(jobId: string): Promise<void> {
    await this.client.delete(`terminal/jobs/${jobId}`);
  }

  /**
   * Get output from a completed or running job.
   * @param jobId Job identifier
   * @param tailLines Number of lines from the end
   */
  async getJobOutput(jobId: string, tailLines?: number): Promise<{ stdout: string; stderr: string }> {
    const params: Record<string, string> = {};
    if (tailLines !== undefined) params.tail = String(tailLines);

    return this.client.get<{ stdout: string; stderr: string }>(
      `terminal/jobs/${jobId}/output`,
      params
    );
  }

  /**
   * Poll for job completion.
   * @param jobId Job identifier
   * @param options Polling options
   */
  async waitForJob(jobId: string, options?: WaitForJobOptions): Promise<TerminalJob> {
    const pollInterval = options?.pollInterval ?? 1000;
    const timeout = options?.timeout;
    const startTime = Date.now();

    while (true) {
      const job = await this.getJob(jobId);

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'timeout') {
        return job;
      }

      if (timeout && (Date.now() - startTime) >= timeout) {
        throw new FleeksTimeoutError(
          `Job ${jobId} did not complete within ${timeout}ms`
        );
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}
