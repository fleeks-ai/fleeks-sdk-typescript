export interface ContainerInfo {
  containerId: string;
  projectId: string;
  template: string;
  status: string;
  ipAddress?: string;
  createdAt: string;
  languages: string[];
  resourceLimits: Record<string, unknown>;
  ports: Record<string, unknown>;
}

export interface ContainerStats {
  containerId: string;
  cpuPercent: number;
  memoryMb: number;
  memoryPercent: number;
  networkRxMb: number;
  networkTxMb: number;
  diskReadMb: number;
  diskWriteMb: number;
  processCount: number;
  timestamp: string;
}

export interface ContainerProcess {
  pid: number;
  user: string;
  command: string;
  cpuPercent: number;
  memoryMb: number;
}

export interface ContainerProcessList {
  containerId: string;
  projectId: string;
  processCount: number;
  processes: ContainerProcess[];
}

export interface ContainerExecResult {
  containerId: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}

export interface ContainerExecOptions {
  workingDir?: string;
  timeoutSeconds?: number;
  environment?: Record<string, string>;
}
