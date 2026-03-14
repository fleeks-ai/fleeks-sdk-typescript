/**
 * Preview session types.
 *
 * Matches backend endpoints:
 *   POST   /api/v1/preview/sessions
 *   GET    /api/v1/preview/sessions/project/{id}
 *   DELETE /api/v1/preview/sessions/{id}
 *   POST   /api/v1/preview/sessions/{id}/refresh
 *   GET    /api/v1/preview/sessions/{id}/health
 *   GET    /api/v1/preview/sessions/detect/{containerId}
 */

// ── Enums ─────────────────────────────────────────────────

export type PreviewStatus = 'starting' | 'running' | 'stopped' | 'error' | 'unhealthy';

export type PreviewFramework =
  | 'react_vite'
  | 'nextjs'
  | 'flask'
  | 'django'
  | 'express'
  | 'fastapi'
  | 'streamlit'
  | 'gradio'
  | 'static'
  | 'rails'
  | 'spring_boot'
  | 'golang'
  | 'custom';

// ── Preview Session ───────────────────────────────────────

export interface PreviewSession {
  id: string;
  projectId: number;
  containerId: string;
  port: number;
  framework: string;
  status: PreviewStatus;
  previewUrl: string;
  startedAt: string;
  lastActivityAt: string;
  stoppedAt: string | null;
}

// ── Start Options ─────────────────────────────────────────

export interface StartPreviewOptions {
  projectId: number;
  port?: number;
  framework?: PreviewFramework;
}

// ── Detected Server ───────────────────────────────────────

export interface DetectedServer {
  port: number;
  framework: string;
  confidence: number;
  command: string;
}

// ── Health ────────────────────────────────────────────────

export interface PreviewHealthStatus {
  healthy: boolean;
  status: PreviewStatus;
  lastCheck: string;
}
