import { FleeksConfig } from './config';
import { getAuthHeaders } from './auth';
import { SDK_VERSION } from './version';
import { toCamelCase, toSnakeCase } from './utils/case';
import {
  FleeksAPIError,
  FleeksRateLimitError,
  FleeksAuthenticationError,
  FleeksPermissionError,
  FleeksResourceNotFoundError,
  FleeksValidationError,
  FleeksConnectionError,
  FleeksTimeoutError,
} from './errors';

export interface RequestOptions {
  params?: Record<string, string>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  skipPrefix?: boolean;
  prefixOverride?: string;
  rawResponse?: boolean;
}

export class HttpClient {
  private config: FleeksConfig;

  constructor(config: FleeksConfig) {
    this.config = config;
  }

  async request<T>(
    method: string,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params, options.skipPrefix, options.prefixOverride);

    const headers: Record<string, string> = {
      ...getAuthHeaders(this.config.apiKey),
      'Accept': 'application/json',
      'User-Agent': `fleeks-js-sdk/${SDK_VERSION}`,
      ...options.headers,
    };

    // Convert body from camelCase to snake_case for the API
    let bodyStr: string | undefined;
    if (options.body) {
      headers['Content-Type'] = 'application/json';
      bodyStr = JSON.stringify(toSnakeCase(options.body));
    }

    return this.withRetry<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: bodyStr,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return {} as T;
        }

        if (options.rawResponse) {
          return await response.text() as unknown as T;
        }

        const json = await response.json() as Record<string, unknown>;
        // Convert response from snake_case to camelCase
        return toCamelCase<T>(json);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new FleeksTimeoutError(
            `Request timed out after ${this.config.timeout}ms`
          );
        }
        if (error instanceof FleeksAPIError) {
          throw error; // Don't wrap already-typed errors
        }
        if (error instanceof FleeksConnectionError || error instanceof FleeksTimeoutError) {
          throw error;
        }
        throw new FleeksConnectionError(
          `Request failed: ${(error as Error).message}`
        );
      }
    });
  }

  /**
   * Make a multipart form data request (for file uploads)
   */
  async requestMultipart<T>(
    method: string,
    endpoint: string,
    formData: FormData,
    options: Omit<RequestOptions, 'body'> = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params, options.skipPrefix, options.prefixOverride);

    const headers: Record<string, string> = {
      ...getAuthHeaders(this.config.apiKey),
      'Accept': 'application/json',
      'User-Agent': `fleeks-js-sdk/${SDK_VERSION}`,
      ...options.headers,
      // Do NOT set Content-Type — fetch sets it with boundary for multipart
    };

    return this.withRetry<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        if (response.status === 204) {
          return {} as T;
        }

        const json = await response.json() as Record<string, unknown>;
        return toCamelCase<T>(json);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new FleeksTimeoutError(
            `Request timed out after ${this.config.timeout}ms`
          );
        }
        if (error instanceof FleeksAPIError) {
          throw error;
        }
        if (error instanceof FleeksConnectionError || error instanceof FleeksTimeoutError) {
          throw error;
        }
        throw new FleeksConnectionError(
          `Request failed: ${(error as Error).message}`
        );
      }
    });
  }

  // ── URL Construction ──────────────────────────────────────
  // Produces /api/v1/sdk/{endpoint} — no trailing slash (FastAPI)

  buildUrl(
    endpoint: string,
    params?: Record<string, string>,
    skipPrefix?: boolean,
    prefixOverride?: string
  ): string {
    let path = endpoint.replace(/^\/+|\/+$/g, ''); // strip slashes

    if (!skipPrefix) {
      const prefix = prefixOverride ?? 'api/v1/sdk';
      path = `${prefix}/${path}`;
    }

    const url = new URL(`/${path}`, this.config.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  /**
   * Get the standard request headers (auth + content negotiation).
   * Useful for custom requests like SSE streaming.
   */
  getRequestHeaders(): Record<string, string> {
    return {
      ...getAuthHeaders(this.config.apiKey),
      'Accept': 'application/json',
      'User-Agent': `fleeks-js-sdk/${SDK_VERSION}`,
    };
  }

  // ── Retry Logic ───────────────────────────────────────────
  // N attempts, exponential backoff: 1s → 2s → 4s (capped at 10s)
  // Only retry on 429, 500, 502, 503, 504, network errors

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error as Error)) {
          throw error;
        }

        if (attempt < this.config.maxRetries) {
          const delay = error instanceof FleeksRateLimitError
            ? error.retryAfter * 1000
            : Math.min(1000 * Math.pow(2, attempt), 10_000);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private isRetryable(error: Error): boolean {
    if (error instanceof FleeksRateLimitError) return true;
    if (error instanceof FleeksConnectionError) return true;
    if (error instanceof FleeksTimeoutError) return true;
    if (error instanceof FleeksAPIError) {
      return [500, 502, 503, 504].includes(error.statusCode ?? 0);
    }
    return false;
  }

  // ── Error Response Mapping ────────────────────────────────

  private async handleErrorResponse(response: Response): Promise<never> {
    let detail = '';
    let body: Record<string, unknown> | undefined;
    try {
      body = await response.json() as Record<string, unknown>;
      detail = (body.detail ?? body.message ?? body.error ?? JSON.stringify(body)) as string;
    } catch {
      detail = await response.text().catch(() => 'Unknown error');
    }

    const message = `API request failed (${response.status}): ${detail}`;

    switch (response.status) {
      case 401:
        throw new FleeksAuthenticationError(message);
      case 403:
        throw new FleeksPermissionError(message);
      case 404:
        throw new FleeksResourceNotFoundError(message);
      case 422:
        throw new FleeksValidationError(message);
      case 429: {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
        throw new FleeksRateLimitError(detail, retryAfter, body);
      }
      default:
        throw new FleeksAPIError(message, response.status);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
