export interface FleeksConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;            // ms (Python uses seconds — CONVERT!)
  maxRetries: number;
  socketioPath: string;
  socketioNamespace: string;
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;     // ms
  respectRateLimits: boolean;
  rateLimitBuffer: number;    // seconds
}

export const DEFAULT_CONFIG: FleeksConfig = {
  apiKey: '',
  baseUrl: 'https://api.fleeks.ai',
  timeout: 30_000,            // 30s in ms
  maxRetries: 3,
  socketioPath: '/socket.io',
  socketioNamespace: '/',
  autoReconnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 1_000,
  respectRateLimits: true,
  rateLimitBuffer: 0.1,
};
