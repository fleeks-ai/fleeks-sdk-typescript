import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleeksClient } from '../../src/client';
import { FileManager } from '../../src/managers/files';

describe('FileManager', () => {
  const VALID_API_KEY = 'fleeks_test_key_for_unit_tests_only_1234567890';
  let client: FleeksClient;
  let files: FileManager;

  beforeEach(() => {
    client = new FleeksClient({ apiKey: VALID_API_KEY });
    files = new FileManager(client, 'test-project');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockFileInfo = {
    path: 'hello.py',
    name: 'hello.py',
    type: 'file',
    size_bytes: 42,
    permissions: '644',
    created_at: '2025-01-01T00:00:00Z',
    modified_at: '2025-01-01T00:00:00Z',
    mime_type: 'text/x-python',
  };

  describe('create', () => {
    it('should create a file', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFileInfo),
      });

      const result = await files.create('hello.py', 'print("Hello!")');

      expect(result.path).toBe('hello.py');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/files/test-project'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('read', () => {
    it('should read file contents', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('print("Hello!")'),
        json: () => Promise.resolve('print("Hello!")'),
      });

      const content = await files.read('hello.py');
      expect(content).toBe('print("Hello!")');
    });
  });

  describe('update', () => {
    it('should update file contents', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFileInfo),
      });

      await files.update('hello.py', 'print("Updated!")');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/files/test-project/content'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await files.delete('hello.py');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sdk/files/test-project/content'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('list', () => {
    it('should list directory contents', async () => {
      const mockListing = {
        project_id: 'test-project',
        path: '.',
        total_count: 1,
        files: [mockFileInfo],
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockListing),
      });

      const listing = await files.list();
      expect(listing.totalCount).toBe(1);
    });
  });

  describe('mkdir', () => {
    it('should create a directory', async () => {
      const mockDirInfo = { ...mockFileInfo, type: 'directory', name: 'src', path: 'src' };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockDirInfo),
      });

      const result = await files.mkdir('src', { parents: true });
      expect(result.path).toBe('src');
    });
  });
});
