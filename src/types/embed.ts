// ── Embed Enums ─────────────────────────────────────────────

export enum EmbedTemplate {
  REACT = 'react',
  VUE = 'vue',
  ANGULAR = 'angular',
  SVELTE = 'svelte',
  NEXTJS = 'nextjs',
  NUXT = 'nuxt',
  ASTRO = 'astro',
  SOLID = 'solid',
  QWIK = 'qwik',
  PYTHON = 'python',
  NODE = 'node',
  TYPESCRIPT = 'typescript',
  GO = 'go',
  RUST = 'rust',
  JAVA = 'java',
  KOTLIN = 'kotlin',
  CSHARP = 'csharp',
  PHP = 'php',
  RUBY = 'ruby',
  FLUTTER = 'flutter',
  REACT_NATIVE = 'react-native',
  SWIFT = 'swift',
  ANDROID = 'android',
  JUPYTER = 'jupyter',
  UNITY = 'unity',
  GODOT = 'godot',
  STATIC = 'static',
  VANILLA_JS = 'vanilla-js',
  DEFAULT = 'default',
}

export enum DisplayMode {
  WEB_PREVIEW = 'web_preview',
  VNC_STREAM = 'vnc_stream',
  GUACAMOLE_STREAM = 'guacamole_stream',
  TERMINAL_ONLY = 'terminal_only',
  NOTEBOOK = 'notebook',
  SPLIT_VIEW = 'split_view',
}

export enum EmbedLayoutPreset {
  EDITOR_ONLY = 'editor-only',
  PREVIEW_ONLY = 'preview-only',
  SIDE_BY_SIDE = 'side-by-side',
  STACKED = 'stacked',
  FULL_IDE = 'full-ide',
  MOBILE_PREVIEW = 'mobile-preview',
  TABLET_PREVIEW = 'tablet-preview',
}

export enum EmbedTheme {
  DARK = 'dark',
  LIGHT = 'light',
  AUTO = 'auto',
  GITHUB_DARK = 'github-dark',
  GITHUB_LIGHT = 'github-light',
  MONOKAI = 'monokai',
  DRACULA = 'dracula',
  NORD = 'nord',
  SOLARIZED_DARK = 'solarized-dark',
  SOLARIZED_LIGHT = 'solarized-light',
}

export enum EmbedStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

// ── Embed Interfaces ────────────────────────────────────────

export interface EmbedInfo {
  id: string;
  name: string;
  template: string;
  status: string;
  displayMode?: string;
  layoutPreset?: string;
  theme?: string;
  files?: Record<string, string>;
  allowedOrigins?: string[];
  sessionTimeoutMinutes?: number;
  maxSessions?: number;
  readOnly?: boolean;
  showTerminal?: boolean;
  showFileTree?: boolean;
  autoRun?: boolean;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmbedOptions {
  name: string;
  template?: EmbedTemplate;
  files?: Record<string, string>;
  allowedOrigins?: string[];
  displayMode?: DisplayMode;
  layoutPreset?: EmbedLayoutPreset;
  theme?: EmbedTheme;
  sessionTimeoutMinutes?: number;
  maxSessions?: number;
  readOnly?: boolean;
  showTerminal?: boolean;
  showFileTree?: boolean;
  autoRun?: boolean;
  description?: string;
}

export interface UpdateEmbedOptions {
  name?: string;
  template?: EmbedTemplate;
  files?: Record<string, string>;
  allowedOrigins?: string[];
  displayMode?: DisplayMode;
  layoutPreset?: EmbedLayoutPreset;
  theme?: EmbedTheme;
  sessionTimeoutMinutes?: number;
  maxSessions?: number;
  readOnly?: boolean;
  showTerminal?: boolean;
  showFileTree?: boolean;
  autoRun?: boolean;
  description?: string;
}

export interface ListEmbedsOptions {
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
  template?: string;
  search?: string;
}

export interface EmbedSession {
  sessionId: string;
  embedId: string;
  status: string;
  startedAt: string;
  lastActivityAt?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface EmbedAnalytics {
  embedId: string;
  period: string;
  totalSessions: number;
  activeSessions: number;
  averageSessionDurationSeconds?: number;
  uniqueUsers?: number;
  pageViews?: number;
}

export interface EmbedStatusChangeResponse {
  id: string;
  status: string;
  message: string;
}
