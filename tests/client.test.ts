import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient, createClient } from '../src/client';
import { FleeksAuthenticationError } from '../src/errors';

describe('FleeksClient', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a client with a valid API key', () => {
      const client = new FleeksClient({ apiKey: VALID_API_KEY });
      expect(client.config.apiKey).toBe(VALID_API_KEY);
      expect(client.config.baseUrl).toBe('https://api.fleeks.ai');
    });

    it('should throw on missing API key', () => {
      expect(() => new FleeksClient({ apiKey: '' })).toThrow(FleeksAuthenticationError);
    });

    it('should throw on invalid API key prefix', () => {
      expect(() => new FleeksClient({ apiKey: 'invalid_key_for_testing_purposes_1234567890' }))
        .toThrow(FleeksAuthenticationError);
    });

    it('should throw on short API key', () => {
      expect(() => new FleeksClient({ apiKey: 'fleeks_short' }))
        .toThrow(FleeksAuthenticationError);
    });

    it('should accept config overrides', () => {
      const client = new FleeksClient({
        apiKey: VALID_API_KEY,
        config: {
          baseUrl: 'https://custom.api.fleeks.ai',
          timeout: 60_000,
        },
      });
      expect(client.config.baseUrl).toBe('https://custom.api.fleeks.ai');
      expect(client.config.timeout).toBe(60_000);
    });

    it('should read API key from env var', () => {
      process.env.FLEEKS_API_KEY = VALID_API_KEY;
      const client = new FleeksClient();
      expect(client.config.apiKey).toBe(VALID_API_KEY);
      delete process.env.FLEEKS_API_KEY;
    });
  });

  describe('createClient factory', () => {
    it('should create a client via factory function', () => {
      const client = createClient(VALID_API_KEY);
      expect(client).toBeInstanceOf(FleeksClient);
      expect(client.config.apiKey).toBe(VALID_API_KEY);
    });
  });

  describe('lazy-loaded managers', () => {
    it('should lazily instantiate workspaces manager', () => {
      const client = new FleeksClient({ apiKey: VALID_API_KEY });
      const ws1 = client.workspaces;
      const ws2 = client.workspaces;
      expect(ws1).toBe(ws2); // Same instance
    });

    it('should lazily instantiate embeds manager', () => {
      const client = new FleeksClient({ apiKey: VALID_API_KEY });
      const e1 = client.embeds;
      const e2 = client.embeds;
      expect(e1).toBe(e2);
    });

    it('should lazily instantiate streaming client', () => {
      const client = new FleeksClient({ apiKey: VALID_API_KEY });
      const s1 = client.streaming;
      const s2 = client.streaming;
      expect(s1).toBe(s2);
    });
  });

  describe('HTTP shorthand methods', () => {
    let client: FleeksClient;

    beforeEach(() => {
      client = new FleeksClient({ apiKey: VALID_API_KEY });
    });

    it('should make GET request', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      });

      const result = await client.get('test/endpoint');
      expect(result).toEqual({ status: 'ok' });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/test/endpoint'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST request with body', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123' }),
      });

      const result = await client.post('test/endpoint', { name: 'test' });
      expect(result).toEqual({ id: '123' });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/test/endpoint'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      );
    });

    it('should make DELETE request', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      await client.delete('test/endpoint');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/test/endpoint'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('utility methods', () => {
    let client: FleeksClient;

    beforeEach(() => {
      client = new FleeksClient({ apiKey: VALID_API_KEY });
    });

    it('should call health endpoint without prefix', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const result = await client.healthCheck();
      expect(result).toEqual({ status: 'healthy' });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      );
    });

    it('should call usage stats endpoint', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ total_requests: 100 }),
      });

      await client.getUsageStats();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/usage/stats'),
        expect.any(Object)
      );
    });

    it('should call API key info endpoint', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ key_id: 'abc' }),
      });

      await client.getApiKeyInfo();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/auth/key-info'),
        expect.any(Object)
      );
    });
  });
});
