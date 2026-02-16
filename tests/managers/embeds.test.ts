import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient } from '../../src/client';
import { Embed, EmbedManager } from '../../src/managers/embeds';
import { EmbedTemplate, DisplayMode } from '../../src/types/embed';

describe('EmbedManager', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';
  let client: FleeksClient;

  beforeEach(() => {
    client = new FleeksClient({ apiKey: VALID_API_KEY });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockEmbedInfo = {
    id: 'embed-abc',
    name: 'My React App',
    template: 'react',
    status: 'active',
    display_mode: 'web_preview',
    files: { 'App.jsx': 'export default () => <h1>Hello</h1>' },
    created_at: '2025-01-01T00:00:00Z',
  };

  describe('create', () => {
    it('should create an embed', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.create({
        name: 'My React App',
        template: EmbedTemplate.REACT,
        files: { 'App.jsx': 'export default () => <h1>Hello</h1>' },
      });

      expect(embed).toBeInstanceOf(Embed);
      expect(embed.id).toBe('embed-abc');
      // Embeds use /api/v1/embeds/ not /api/v1/sdk/embeds/
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/embeds/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('list', () => {
    it('should list embeds', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([mockEmbedInfo]),
      });

      const embeds = await client.embeds.list();
      expect(embeds).toHaveLength(1);
      expect(embeds[0]).toBeInstanceOf(Embed);
    });
  });

  describe('get', () => {
    it('should get a specific embed', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.get('embed-abc');
      expect(embed.id).toBe('embed-abc');
      expect(embed.info.name).toBe('My React App');
    });
  });

  describe('convenience factories', () => {
    it('should create a React embed', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.createReact('Test', { 'App.jsx': '<h1>Hi</h1>' });
      expect(embed).toBeInstanceOf(Embed);

      const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(body.template).toBe('react');
      expect(body.display_mode).toBe('web_preview');
    });

    it('should create a Python embed', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...mockEmbedInfo, template: 'python' }),
      });

      const embed = await client.embeds.createPython('Test', { 'main.py': 'print("hi")' });
      expect(embed).toBeInstanceOf(Embed);
    });
  });

  describe('Embed instance', () => {
    it('should generate correct embed URL', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.get('embed-abc');
      expect(embed.embedUrl).toBe('https://embed.fleeks.ai/embed-abc');
    });

    it('should generate iframe HTML', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.get('embed-abc');
      expect(embed.iframeHtml).toContain('<iframe');
      expect(embed.iframeHtml).toContain('embed-abc');
    });

    it('should generate markdown embed', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.get('embed-abc');
      expect(embed.markdownEmbed).toBe('<FleeksEmbed id="embed-abc" />');
    });

    it('should update an embed', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.get('embed-abc');

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...mockEmbedInfo, name: 'Updated' }),
      });

      const updated = await embed.update({ name: 'Updated' });
      expect(updated).toBeInstanceOf(Embed);
    });

    it('should pause and resume', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmbedInfo),
      });

      const embed = await client.embeds.get('embed-abc');

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'embed-abc', status: 'paused', message: 'Paused' }),
      });

      const pauseResult = await embed.pause();
      expect(pauseResult.status).toBe('paused');
    });
  });
});
