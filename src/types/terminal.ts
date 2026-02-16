export interface TerminalJob {
  jobId: string;
  projectId: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  exitCode?: number;
  stdout: string;
  stderr: string;
  startedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
}

export interface TerminalJobList {
  projectId: string;
  totalCount: number;
  jobs: TerminalJob[];
}

export interface ExecuteOptions {
  workingDir?: string;
  environment?: Record<string, string>;
  timeoutSeconds?: number;
}

export interface BackgroundJobOptions {
  workingDir?: string;
  environment?: Record<string, string>;
}

export interface WaitForJobOptions {
  pollInterval?: number;       // ms, default: 1000
  timeout?: number;            // ms
}
