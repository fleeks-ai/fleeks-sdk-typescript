/**
 * VoiceManager — real-time voice conversations with Fleeks AI agents.
 *
 * Uses Socket.IO to stream PCM audio to/from the backend Gemini Live API.
 *
 * @example
 * ```ts
 * const session = await client.voice.start({ agentSessionId: 'agt_xyz' });
 *
 * // Send mic audio (base64 PCM16 16kHz mono LE)
 * session.sendAudio(audioChunkB64);
 *
 * // Listen for events
 * for await (const event of session.events()) {
 *   if (event.type === VoiceEventType.AUDIO_RESPONSE) {
 *     playAudio(event.audioResponse!.audio);
 *   } else if (event.type === VoiceEventType.OUTPUT_TRANSCRIPT) {
 *     console.log('Agent:', event.transcript!.text);
 *   }
 * }
 *
 * await session.stop();
 * ```
 */

import { io, Socket } from 'socket.io-client';
import type { FleeksConfig } from '../config';
import type { FleeksClient } from '../client';
import { FleeksConnectionError, FleeksStreamingError } from '../errors';
import {
  VoiceEventType,
} from '../types/voice';
import type {
  VoiceStartOptions,
  VoiceSessionInfo,
  VoiceEvent,
  VoiceConfig,
  VoiceStats,
  VoiceHealth,
} from '../types/voice';

// ── VoiceSession ────────────────────────────────────────────

/**
 * An active voice conversation session.
 * Provides methods to send audio/text and async-iterate voice events.
 */
export class VoiceSession {
  readonly sessionId: string;
  private socket: Socket;
  private queue: VoiceEvent[] = [];
  private resolve: (() => void) | null = null;
  private _closed = false;

  /** @internal */
  constructor(sessionId: string, socket: Socket) {
    this.sessionId = sessionId;
    this.socket = socket;
  }

  get isActive(): boolean {
    return !this._closed;
  }

  /**
   * Send a base64-encoded PCM16 audio chunk (16kHz mono LE, ~100ms recommended).
   */
  sendAudio(audioB64: string): void {
    if (this._closed) throw new FleeksStreamingError('Voice session is closed');
    this.socket.emit('voice_audio_chunk', {
      session_id: this.sessionId,
      audio: audioB64,
    });
  }

  /**
   * Send raw PCM16 bytes as a Uint8Array. Auto-encodes to base64.
   */
  sendAudioBytes(pcmBytes: Uint8Array): void {
    const b64 = uint8ToBase64(pcmBytes);
    this.sendAudio(b64);
  }

  /**
   * Send text into the active voice session.
   */
  sendText(text: string): void {
    if (this._closed) throw new FleeksStreamingError('Voice session is closed');
    this.socket.emit('voice_text_input', {
      session_id: this.sessionId,
      text,
    });
  }

  /**
   * Signal mic muted (sends audio_stream_end to Gemini).
   */
  mute(): void {
    if (this._closed) return;
    this.socket.emit('voice_mute', { session_id: this.sessionId });
  }

  /**
   * Stop the voice session.
   */
  stop(): void {
    if (this._closed) return;
    this._closed = true;
    this.socket.emit('voice_stop', { session_id: this.sessionId });
  }

  /**
   * Async iterable over voice events (audio, transcripts, tools, errors).
   * Yields VoiceEvent objects until the session ends.
   */
  async *events(): AsyncIterable<VoiceEvent> {
    while (!this._closed) {
      if (this.queue.length > 0) {
        const event = this.queue.shift()!;
        yield event;
        if (
          event.type === VoiceEventType.SESSION_ENDED ||
          event.type === VoiceEventType.ERROR
        ) {
          this._closed = true;
          break;
        }
      } else {
        await new Promise<void>((r) => {
          this.resolve = r;
        });
        this.resolve = null;
      }
    }
  }

  /** @internal — push event from handler */
  _pushEvent(event: VoiceEvent): void {
    this.queue.push(event);
    this.resolve?.();
  }

  /** @internal — mark closed externally */
  _markClosed(): void {
    this._closed = true;
    this.resolve?.();
  }
}

// ── VoiceManager ────────────────────────────────────────────

export class VoiceManager {
  private client: FleeksClient;
  private config: FleeksConfig;
  private socket: Socket | null = null;
  private connected = false;
  private activeSession: VoiceSession | null = null;

  constructor(client: FleeksClient) {
    this.client = client;
    this.config = client.config;
  }

  // ── REST endpoints ──────────────────────────────────────

  /**
   * Get voice configuration (available models, voices, limits).
   */
  async getConfig(): Promise<VoiceConfig> {
    return this.client.get<VoiceConfig>('voice/config');
  }

  /**
   * List active voice sessions for the current user.
   */
  async getSessions(): Promise<VoiceSessionInfo[]> {
    const result = await this.client.get<{ sessions: VoiceSessionInfo[] }>(
      'voice/sessions',
    );
    return result.sessions ?? [];
  }

  /**
   * Get voice service statistics.
   */
  async getStats(): Promise<VoiceStats> {
    return this.client.get<VoiceStats>('voice/stats');
  }

  /**
   * Check voice service health.
   */
  async health(): Promise<VoiceHealth> {
    return this.client.get<VoiceHealth>('voice/health');
  }

  // ── Socket.IO session management ─────────────────────────

  /**
   * Start a new voice session.
   *
   * @param options Voice start options (agentSessionId is required)
   * @returns A VoiceSession for sending audio/text and receiving events
   *
   * @example
   * ```ts
   * const session = await client.voice.start({
   *   agentSessionId: 'agt_xyz',
   *   voiceName: 'Kore',
   * });
   *
   * session.sendAudio(chunk);
   * for await (const event of session.events()) { ... }
   * session.stop();
   * ```
   */
  async start(options: VoiceStartOptions): Promise<VoiceSession> {
    await this.ensureConnected();

    const timeout = options.timeout ?? 10;

    // Create session and register handlers before emitting start
    const session = new VoiceSession('pending', this.socket!);
    this.activeSession = session;
    this.registerVoiceHandlers(session);

    // Wait for session_started confirmation
    const startedPromise = new Promise<VoiceSessionInfo>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new FleeksStreamingError(
            'Voice session failed to start within timeout',
          ),
        );
      }, timeout * 1000);

      const handler = (data: Record<string, unknown>) => {
        clearTimeout(timer);
        this.socket!.off('voice_session_started', handler);
        resolve({
          sessionId: (data.session_id as string) ?? '',
          state: data.state as any,
          model: (data.model as string) ?? '',
          voiceName: (data.voice_name as string) ?? '',
          createdAt: (data.created_at as string) ?? '',
          agentSessionId: data.agent_session_id as string,
          workspaceId: data.workspace_id as string,
        });
      };
      this.socket!.on('voice_session_started', handler);
    });

    // Emit voice_start
    this.socket!.emit('voice_start', {
      agent_session_id: options.agentSessionId,
      voice_name: options.voiceName ?? 'Kore',
      language: options.language ?? 'en',
      model: options.model ?? 'gemini-3.1-flash-live-preview',
      thinking_level: options.thinkingLevel ?? 'minimal',
      enable_tools: options.enableTools ?? true,
      workspace_id: options.workspaceId,
      project_id: options.projectId,
      system_instruction: options.systemInstruction ?? '',
    });

    const info = await startedPromise;

    // Update session ID from server confirmation
    (session as any).sessionId = info.sessionId;
    return session;
  }

  /**
   * Disconnect voice Socket.IO connection and clean up.
   */
  async disconnect(): Promise<void> {
    if (this.activeSession?.isActive) {
      this.activeSession.stop();
    }
    this.activeSession = null;

    if (this.socket && this.connected) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /** Whether the voice socket is currently connected. */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Private helpers ──────────────────────────────────────

  private async ensureConnected(): Promise<void> {
    if (this.connected && this.socket?.connected) return;

    return new Promise<void>((resolve, reject) => {
      this.socket = io(this.config.baseUrl, {
        path: this.config.socketioPath,
        auth: { api_key: this.config.apiKey },
        reconnection: this.config.autoReconnect,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        reject(
          new FleeksConnectionError(
            `Voice Socket.IO connection failed: ${err.message}`,
          ),
        );
      });
    });
  }

  private registerVoiceHandlers(session: VoiceSession): void {
    if (!this.socket) return;

    // voice_session_started is handled by the start() promise, but also push to queue
    this.socket.on('voice_session_started', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.SESSION_STARTED,
        sessionId: (data.session_id as string) ?? '',
        sessionInfo: {
          sessionId: (data.session_id as string) ?? '',
          state: data.state as any,
          model: (data.model as string) ?? '',
          voiceName: (data.voice_name as string) ?? '',
          createdAt: (data.created_at as string) ?? '',
        },
      });
    });

    this.socket.on('voice_audio_response', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.AUDIO_RESPONSE,
        sessionId: (data.session_id as string) ?? '',
        audioResponse: {
          audio: (data.audio as string) ?? '',
          mimeType:
            (data.mime_type as string) ?? 'audio/pcm;rate=24000',
        },
      });
    });

    this.socket.on(
      'voice_input_transcript',
      (data: Record<string, unknown>) => {
        session._pushEvent({
          type: VoiceEventType.INPUT_TRANSCRIPT,
          sessionId: (data.session_id as string) ?? '',
          transcript: {
            text: (data.text as string) ?? '',
            role: 'user',
          },
        });
      },
    );

    this.socket.on(
      'voice_output_transcript',
      (data: Record<string, unknown>) => {
        session._pushEvent({
          type: VoiceEventType.OUTPUT_TRANSCRIPT,
          sessionId: (data.session_id as string) ?? '',
          transcript: {
            text: (data.text as string) ?? '',
            role: 'agent',
          },
        });
      },
    );

    this.socket.on('voice_tool_start', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.TOOL_START,
        sessionId: (data.session_id as string) ?? '',
        toolExecution: {
          callId: (data.call_id as string) ?? '',
          functionName: (data.function_name as string) ?? '',
          arguments: (data.arguments as Record<string, unknown>) ?? {},
          status: 'running',
        },
      });
    });

    this.socket.on('voice_tool_result', (data: Record<string, unknown>) => {
      const success = (data.success as boolean) ?? true;
      session._pushEvent({
        type: VoiceEventType.TOOL_RESULT,
        sessionId: (data.session_id as string) ?? '',
        toolExecution: {
          callId: (data.call_id as string) ?? '',
          functionName: (data.function_name as string) ?? '',
          arguments: {},
          result: data.result,
          executionTime: data.execution_time as number | undefined,
          success,
          status: success ? 'completed' : 'failed',
        },
      });
    });

    this.socket.on('voice_interrupted', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.INTERRUPTED,
        sessionId: (data.session_id as string) ?? '',
      });
    });

    this.socket.on('voice_state_changed', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.STATE_CHANGED,
        sessionId: (data.session_id as string) ?? '',
        oldState: data.old_state as string,
        newState: data.new_state as string,
      });
    });

    this.socket.on('voice_error', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.ERROR,
        sessionId: (data.session_id as string) ?? '',
        error: (data.error as string) ?? 'Unknown voice error',
      });
    });

    this.socket.on('voice_session_ended', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.SESSION_ENDED,
        sessionId: (data.session_id as string) ?? '',
      });
      session._markClosed();
    });

    this.socket.on('voice_usage', (data: Record<string, unknown>) => {
      session._pushEvent({
        type: VoiceEventType.USAGE,
        sessionId: (data.session_id as string) ?? '',
        usage: {
          inputTokens: (data.input_tokens as number) ?? 0,
          outputTokens: (data.output_tokens as number) ?? 0,
        },
      });
    });
  }
}

// ── Helpers ─────────────────────────────────────────────────

function uint8ToBase64(bytes: Uint8Array): string {
  // Works in Node >=16 and modern browsers
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  // Browser fallback
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
