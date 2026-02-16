/** Streaming event types for Socket.IO */

export interface FileChangeEvent {
  sessionId: string;
  path: string;
  eventType: 'created' | 'modified' | 'deleted' | 'moved';
  content?: string;
  oldPath?: string;
  timestamp: string;
}

export interface AgentStreamEvent {
  sessionId: string;
  agentId: string;
  status: string;
  progress: number;
  currentStep?: string;
  message?: string;
  timestamp: string;
}

export interface TerminalStreamEvent {
  sessionId: string;
  output: string;
  stream: 'stdout' | 'stderr';
  timestamp: string;
}

export interface StreamError {
  sessionId: string;
  error: string;
  message: string;
}

export interface WatchFilesOptions {
  patterns?: string[];
  callback?: (event: FileChangeEvent) => void;
}

export interface StreamAgentOptions {
  callback?: (event: AgentStreamEvent) => void;
}

export interface StreamTerminalOptions {
  callback?: (event: TerminalStreamEvent) => void;
}

export interface ActiveStreams {
  files: number;
  agents: number;
  terminals: number;
}
