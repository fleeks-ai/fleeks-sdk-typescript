import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../src/http';
import { DEFAULT_CONFIG, FleeksConfig } from '../src/config';
import {
  FleeksAPIError,
  FleeksAuthenticationError,
  FleeksPermissionError,
  FleeksResourceNotFoundError,
  FleeksValidationError,
  FleeksRateLimitError,
  FleeksTimeoutError,
  FleeksConnectionError,
} from '../src/errors';

describe('HttpClient', () => {
  const config: FleeksConfig = {
    ...DEFAULT_CONFIG,
    apiKey: 'fleeks_test_key_for_unit_tests_only_1234567890',
    maxRetries: 0, // Disable retries for unit tests
  };
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient(config);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL construction', () => {
    it('should build URL with default prefix', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('GET', 'workspaces');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/workspaces'),
        expect.any(Object)
      );
    });

    it('should build URL with prefix override', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('GET', 'embeds', { prefixOverride: 'api/v1' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/embeds'),
        expect.any(Object)
      );
    });

    it('should skip prefix when skipPrefix is true', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('GET', 'health', { skipPrefix: true });

      const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(url).toContain('/health');
      expect(url).not.toContain('/api/v1/sdk/');
    });

    it('should add query params', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('GET', 'workspaces', {
        params: { page: '1', page_size: '10' },
      });

      const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('page_size=10');
    });

    it('should strip trailing slash (FastAPI)', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('GET', 'workspaces/test-123');

      const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      const urlPath = new URL(url).pathname;
      expect(urlPath.endsWith('/')).toBe(false);
    });
  });

  describe('request headers', () => {
    it('should include auth headers', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('GET', 'test');

      const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
      expect(headers['X-API-Key']).toBe(config.apiKey);
      expect(headers['Authorization']).toBe(`Bearer ${config.apiKey}`);
      expect(headers['Accept']).toBe('application/json');
    });

    it('should add Content-Type for POST with body', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('POST', 'test', { body: { name: 'test' } });

      const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('response handling', () => {
    it('should handle 204 No Content', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await httpClient.request('DELETE', 'test');
      expect(result).toEqual({});
    });

    it('should convert snake_case response to camelCase', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ project_id: 'abc', created_at: '2025-01-01' }),
      });

      const result = await httpClient.request<{ projectId: string; createdAt: string }>('GET', 'test');
      expect(result.projectId).toBe('abc');
      expect(result.createdAt).toBe('2025-01-01');
    });

    it('should convert camelCase body to snake_case', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await httpClient.request('POST', 'test', {
        body: { projectId: 'abc', maxIterations: 10 },
      });

      const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(body.project_id).toBe('abc');
      expect(body.max_iterations).toBe(10);
    });
  });

  describe('error handling', () => {
    it('should throw FleeksAuthenticationError on 401', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Invalid API key' }),
      });

      await expect(httpClient.request('GET', 'test'))
        .rejects.toThrow(FleeksAuthenticationError);
    });

    it('should throw FleeksPermissionError on 403', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: 'Forbidden' }),
      });

      await expect(httpClient.request('GET', 'test'))
        .rejects.toThrow(FleeksPermissionError);
    });

    it('should throw FleeksResourceNotFoundError on 404', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      await expect(httpClient.request('GET', 'test'))
        .rejects.toThrow(FleeksResourceNotFoundError);
    });

    it('should throw FleeksValidationError on 422', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ detail: 'Validation error' }),
      });

      await expect(httpClient.request('GET', 'test'))
        .rejects.toThrow(FleeksValidationError);
    });

    it('should throw FleeksRateLimitError on 429 with retryAfter and preserve detail', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '30' }),
        json: () => Promise.resolve({ detail: 'Rate limited' }),
      });

      try {
        await httpClient.request('GET', 'test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FleeksRateLimitError);
        const rle = error as FleeksRateLimitError;
        expect(rle.retryAfter).toBe(30);
        expect(rle.message).toBe('Rate limited');
        expect(rle.response).toEqual({ detail: 'Rate limited' });
      }
    });

    it('should throw FleeksAPIError on other status codes', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Internal error' }),
      });

      try {
        await httpClient.request('GET', 'test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FleeksAPIError);
        expect((error as FleeksAPIError).statusCode).toBe(500);
      }
    });

    it('should throw FleeksConnectionError on network failure', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'));

      await expect(httpClient.request('GET', 'test'))
        .rejects.toThrow(FleeksConnectionError);
    });
  });

  describe('retry logic', () => {
    it('should retry on 500 errors', async () => {
      const retryConfig = { ...config, maxRetries: 2 };
      const retryClient = new HttpClient(retryConfig);

      let callCount = 0;
      (fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ detail: 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const result = await retryClient.request('GET', 'test');
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(3);
    });

    it('should NOT retry on 401 errors', async () => {
      const retryConfig = { ...config, maxRetries: 2 };
      const retryClient = new HttpClient(retryConfig);

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Unauthorized' }),
      });

      await expect(retryClient.request('GET', 'test'))
        .rejects.toThrow(FleeksAuthenticationError);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on 404 errors', async () => {
      const retryConfig = { ...config, maxRetries: 2 };
      const retryClient = new HttpClient(retryConfig);

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      await expect(retryClient.request('GET', 'test'))
        .rejects.toThrow(FleeksResourceNotFoundError);

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
