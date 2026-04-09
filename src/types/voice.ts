/**
 * Voice session types for real-time voice conversations with Fleeks AI agents.
 *
 * Protocol (Socket.IO events):
 *   Client → Server: voice_start, voice_audio_chunk, voice_text_input, voice_mute, voice_stop
 *   Server → Client: voice_session_started, voice_audio_response, voice_input_transcript,
 *                     voice_output_transcript, voice_tool_start, voice_tool_result,
 *                     voice_interrupted, voice_state_changed, voice_error,
 *                     voice_session_ended, voice_usage
 */

// ── Enums ───────────────────────────────────────────────────

export enum VoiceSessionState {
  CREATED = 'created',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  STREAMING = 'streaming',
  RECONNECTING = 'reconnecting',
  CLOSING = 'closing',
  CLOSED = 'closed',
  ERROR = 'error',
}

export enum VoiceEventType {
  SESSION_STARTED = 'session_started',
  AUDIO_RESPONSE = 'audio_response',
  INPUT_TRANSCRIPT = 'input_transcript',
  OUTPUT_TRANSCRIPT = 'output_transcript',
  TOOL_START = 'tool_start',
  TOOL_RESULT = 'tool_result',
  INTERRUPTED = 'interrupted',
  STATE_CHANGED = 'state_changed',
  ERROR = 'error',
  SESSION_ENDED = 'session_ended',
  USAGE = 'usage',
}

// ── Start options ───────────────────────────────────────────

export interface VoiceStartOptions {
  /** Agent session to attach voice to (required). */
  agentSessionId: string;
  /** Voice name — "Aoede" | "Charon" | "Fenrir" | "Kore" | "Puck". Default: "Kore". */
  voiceName?: string;
  /** Language code. Default: "en". */
  language?: string;
  /** Gemini model. Default: "gemini-3.1-flash-live-preview". */
  model?: string;
  /** Thinking level — "minimal" | "low" | "medium" | "high". Default: "minimal". */
  thinkingLevel?: string;
  /** Whether the agent can use tools during voice. Default: true. */
  enableTools?: boolean;
  /** Optional workspace context. */
  workspaceId?: string;
  /** Optional project context. */
  projectId?: string;
  /** Optional system instruction override. */
  systemInstruction?: string;
  /** Seconds to wait for session_started confirmation. Default: 10. */
  timeout?: number;
}

// ── Session info ────────────────────────────────────────────

export interface VoiceSessionInfo {
  sessionId: string;
  state: VoiceSessionState;
  model: string;
  voiceName: string;
  createdAt: string;
  agentSessionId?: string;
  workspaceId?: string;
}

// ── Event payloads ──────────────────────────────────────────

export interface VoiceAudioResponse {
  /** Base64-encoded PCM audio bytes. */
  audio: string;
  /** MIME type, e.g. "audio/pcm;rate=24000". */
  mimeType: string;
}

export interface VoiceTranscript {
  text: string;
  role: 'user' | 'agent';
}

export interface VoiceToolExecution {
  callId: string;
  functionName: string;
  arguments: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed';
  result?: unknown;
  executionTime?: number;
  success?: boolean;
}

export interface VoiceUsage {
  inputTokens: number;
  outputTokens: number;
}

// ── Unified event ───────────────────────────────────────────

export interface VoiceEvent {
  type: VoiceEventType;
  sessionId: string;
  /** Present when type === SESSION_STARTED. */
  sessionInfo?: VoiceSessionInfo;
  /** Present when type === AUDIO_RESPONSE. */
  audioResponse?: VoiceAudioResponse;
  /** Present when type === INPUT_TRANSCRIPT or OUTPUT_TRANSCRIPT. */
  transcript?: VoiceTranscript;
  /** Present when type === TOOL_START or TOOL_RESULT. */
  toolExecution?: VoiceToolExecution;
  /** Present when type === USAGE. */
  usage?: VoiceUsage;
  /** Present when type === STATE_CHANGED. */
  oldState?: string;
  /** Present when type === STATE_CHANGED. */
  newState?: string;
  /** Present when type === ERROR. */
  error?: string;
}

// ── REST response types ─────────────────────────────────────

export interface VoiceConfig {
  models: string[];
  voices: string[];
  limits: Record<string, unknown>;
  defaults: Record<string, unknown>;
}

export interface VoiceStats {
  activeSessions: number;
  totalSessions: number;
  capacity: number;
}

export interface VoiceHealth {
  status: string;
  components: Record<string, unknown>;
}

// ── Callback types ──────────────────────────────────────────

export type VoiceEventCallback = (event: VoiceEvent) => void;
