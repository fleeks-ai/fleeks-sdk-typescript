import { io, Socket } from 'socket.io-client';
import type { FleeksConfig } from '../config';
import { FleeksStreamingError } from '../errors';
import type {
  FileChangeEvent,
  AgentStreamEvent,
  TerminalStreamEvent,
  ActiveStreams,
} from '../types/streaming';

/**
 * StreamingClient wraps Socket.IO for real-time events:
 * file watching, agent progress streaming, and terminal output.
 */
export class StreamingClient {
  private socket: Socket | null = null;
  private config: FleeksConfig;

  private activeFileStreams = new Set<string>();
  private activeAgentStreams = new Set<string>();
  private activeTerminalStreams = new Set<string>();

  constructor(config: FleeksConfig) {
    this.config = config;
  }

  /**
   * Connect to the Socket.IO server.
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    return new Promise<void>((resolve, reject) => {
      this.socket = io(this.config.baseUrl, {
        path: this.config.socketioPath,
        auth: { api_key: this.config.apiKey },
        reconnection: this.config.autoReconnect,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => resolve());
      this.socket.on('connect_error', (err) => {
        reject(new FleeksStreamingError(`Socket.IO connection failed: ${err.message}`));
      });
    });
  }

  /**
   * Disconnect from the Socket.IO server and clean up all streams.
   */
  async disconnect(): Promise<void> {
    if (!this.socket) return;

    // Stop all active streams
    for (const sessionId of this.activeFileStreams) {
      this.socket.emit('sdk:file_watch:stop', { session_id: sessionId });
    }
    for (const sessionId of this.activeAgentStreams) {
      this.socket.emit('sdk:agent_stream:stop', { session_id: sessionId });
    }
    for (const sessionId of this.activeTerminalStreams) {
      this.socket.emit('sdk:terminal_stream:stop', { session_id: sessionId });
    }

    this.activeFileStreams.clear();
    this.activeAgentStreams.clear();
    this.activeTerminalStreams.clear();

    this.socket.disconnect();
    this.socket = null;
  }

  /** Whether the socket is currently connected. */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get counts of active streams.
   */
  getActiveStreams(): ActiveStreams {
    return {
      files: this.activeFileStreams.size,
      agents: this.activeAgentStreams.size,
      terminals: this.activeTerminalStreams.size,
    };
  }

  /**
   * Watch file changes in a workspace. Returns an AsyncIterable.
   * @param workspaceId Workspace/project ID
   * @param options Watch options
   */
  async *watchFiles(
    workspaceId: string,
    options?: { patterns?: string[]; callback?: (event: FileChangeEvent) => void }
  ): AsyncIterable<FileChangeEvent> {
    await this.ensureConnected();

    const sessionId = crypto.randomUUID();
    const patterns = options?.patterns ?? ['**/*'];
    const queue: FileChangeEvent[] = [];
    let resolve: (() => void) | null = null;
    let done = false;

    const handler = (event: FileChangeEvent) => {
      if (event.sessionId === sessionId) {
        options?.callback?.(event);
        queue.push(event);
        resolve?.();
      }
    };

    const errorHandler = (event: { session_id: string; error: string; message: string }) => {
      if (event.session_id === sessionId) {
        done = true;
        resolve?.();
      }
    };

    this.socket!.on('sdk_file_watch_change', handler);
    this.socket!.on('sdk_file_watch_error', errorHandler);
    this.socket!.emit('sdk:file_watch:start', {
      workspace_id: workspaceId,
      patterns,
      session_id: sessionId,
    });
    this.activeFileStreams.add(sessionId);

    try {
      while (!done) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise<void>(r => { resolve = r; });
          resolve = null;
        }
      }
    } finally {
      this.socket!.off('sdk_file_watch_change', handler);
      this.socket!.off('sdk_file_watch_error', errorHandler);
      this.socket!.emit('sdk:file_watch:stop', { session_id: sessionId });
      this.activeFileStreams.delete(sessionId);
    }
  }

  /**
   * Stream agent progress events. Returns an AsyncIterable.
   * @param agentId Agent identifier
   * @param options Stream options
   */
  async *streamAgent(
    agentId: string,
    options?: { callback?: (event: AgentStreamEvent) => void }
  ): AsyncIterable<AgentStreamEvent> {
    await this.ensureConnected();

    const sessionId = crypto.randomUUID();
    const queue: AgentStreamEvent[] = [];
    let resolve: (() => void) | null = null;
    let done = false;

    const handler = (event: AgentStreamEvent) => {
      if (event.sessionId === sessionId) {
        options?.callback?.(event);
        queue.push(event);
        resolve?.();

        // Auto-complete when agent finishes
        if (event.status === 'completed' || event.status === 'failed') {
          done = true;
          resolve?.();
        }
      }
    };

    const errorHandler = (event: { session_id: string; error: string; message: string }) => {
      if (event.session_id === sessionId) {
        done = true;
        resolve?.();
      }
    };

    this.socket!.on('sdk_agent_stream_update', handler);
    this.socket!.on('sdk_agent_stream_error', errorHandler);
    this.socket!.emit('sdk:agent_stream:start', {
      agent_id: agentId,
      session_id: sessionId,
    });
    this.activeAgentStreams.add(sessionId);

    try {
      while (!done) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise<void>(r => { resolve = r; });
          resolve = null;
        }
      }
      // Yield remaining items
      while (queue.length > 0) {
        yield queue.shift()!;
      }
    } finally {
      this.socket!.off('sdk_agent_stream_update', handler);
      this.socket!.off('sdk_agent_stream_error', errorHandler);
      this.socket!.emit('sdk:agent_stream:stop', { session_id: sessionId });
      this.activeAgentStreams.delete(sessionId);
    }
  }

  /**
   * Stream terminal output. Returns an AsyncIterable.
   * @param workspaceId Workspace/project ID
   * @param terminalSessionId Terminal session identifier
   * @param options Stream options
   */
  async *streamTerminal(
    workspaceId: string,
    terminalSessionId: string,
    options?: { callback?: (event: TerminalStreamEvent) => void }
  ): AsyncIterable<TerminalStreamEvent> {
    await this.ensureConnected();

    const sessionId = crypto.randomUUID();
    const queue: TerminalStreamEvent[] = [];
    let resolve: (() => void) | null = null;
    let done = false;

    const handler = (event: TerminalStreamEvent) => {
      if (event.sessionId === sessionId) {
        options?.callback?.(event);
        queue.push(event);
        resolve?.();
      }
    };

    const errorHandler = (event: { session_id: string; error: string; message: string }) => {
      if (event.session_id === sessionId) {
        done = true;
        resolve?.();
      }
    };

    this.socket!.on('sdk_terminal_stream_output', handler);
    this.socket!.on('sdk_terminal_stream_error', errorHandler);
    this.socket!.emit('sdk:terminal_stream:start', {
      workspace_id: workspaceId,
      terminal_session_id: terminalSessionId,
      session_id: sessionId,
    });
    this.activeTerminalStreams.add(sessionId);

    try {
      while (!done) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise<void>(r => { resolve = r; });
          resolve = null;
        }
      }
      while (queue.length > 0) {
        yield queue.shift()!;
      }
    } finally {
      this.socket!.off('sdk_terminal_stream_output', handler);
      this.socket!.off('sdk_terminal_stream_error', errorHandler);
      this.socket!.emit('sdk:terminal_stream:stop', { session_id: sessionId });
      this.activeTerminalStreams.delete(sessionId);
    }
  }

  // ── Internal helpers ──────────────────────────────────────

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }
}
