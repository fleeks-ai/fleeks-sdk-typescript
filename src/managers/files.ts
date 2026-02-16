import type { FleeksClient } from '../client';
import type {
  FileInfo,
  DirectoryListing,
  CreateFileOptions,
  UpdateFileOptions,
  ListFilesOptions,
  MkdirOptions,
  UploadFileOptions,
} from '../types/file';

export class FileManager {
  private client: FleeksClient;
  private projectId: string;

  constructor(client: FleeksClient, projectId: string) {
    this.client = client;
    this.projectId = projectId;
  }

  /**
   * Create a new file in the workspace.
   * @param path File path (no leading /)
   * @param content File content
   * @param options Additional options
   */
  async create(path: string, content?: string, options?: CreateFileOptions): Promise<FileInfo> {
    return this.client.post<FileInfo>(`files/${this.projectId}`, {
      path,
      content: content ?? '',
      ...(options?.encoding && { encoding: options.encoding }),
      ...(options?.permissions && { permissions: options.permissions }),
    });
  }

  /**
   * Read file content as string.
   * @param path File path (no leading /)
   * @param encoding Character encoding (default: utf-8)
   */
  async read(path: string, encoding?: string): Promise<string> {
    const params: Record<string, string> = { path };
    if (encoding) params.encoding = encoding;

    return this.client.httpClient.request<string>('GET', `files/${this.projectId}/content`, {
      params,
      rawResponse: true,
    });
  }

  /**
   * Read file content as binary.
   * @param path File path (no leading /)
   */
  async readBinary(path: string): Promise<string> {
    return this.client.httpClient.request<string>('GET', `files/${this.projectId}/content`, {
      params: { path, binary: 'true' },
      rawResponse: true,
    });
  }

  /**
   * Update existing file content.
   * @param path File path (no leading /)
   * @param content New content
   * @param options Additional options
   */
  async update(path: string, content: string, options?: UpdateFileOptions): Promise<FileInfo> {
    return this.client.put<FileInfo>(`files/${this.projectId}/content`, {
      path,
      content,
      ...(options?.encoding && { encoding: options.encoding }),
      ...(options?.createIfMissing !== undefined && { createIfMissing: options.createIfMissing }),
    });
  }

  /**
   * Delete a file.
   * @param path File path (no leading /)
   */
  async delete(path: string): Promise<void> {
    await this.client.httpClient.request<Record<string, unknown>>('DELETE', `files/${this.projectId}/content`, {
      params: { path },
    });
  }

  /**
   * List directory contents.
   * @param path Directory path (default: root)
   * @param options List options
   */
  async list(path?: string, options?: ListFilesOptions): Promise<DirectoryListing> {
    const params: Record<string, string> = {};
    if (path) params.path = path;
    if (options?.recursive !== undefined) params.recursive = String(options.recursive);
    if (options?.includeHidden !== undefined) params.include_hidden = String(options.includeHidden);

    return this.client.get<DirectoryListing>(`files/${this.projectId}`, params);
  }

  /**
   * Create a directory.
   * @param path Directory path (no leading /)
   * @param options Mkdir options
   */
  async mkdir(path: string, options?: MkdirOptions): Promise<FileInfo> {
    return this.client.post<FileInfo>(`files/${this.projectId}/directories`, {
      path,
      ...(options?.parents !== undefined && { parents: options.parents }),
      ...(options?.permissions && { permissions: options.permissions }),
    });
  }

  /**
   * Upload a file.
   * @param path Destination path
   * @param file File data (Blob, Buffer, or ReadableStream)
   * @param options Upload options
   */
  async upload(
    path: string,
    file: Blob | Buffer | ReadableStream,
    options?: UploadFileOptions
  ): Promise<FileInfo> {
    const formData = new FormData();
    formData.append('path', path);

    if (file instanceof Blob) {
      formData.append('file', file);
    } else if (Buffer.isBuffer(file)) {
      formData.append('file', new Blob([file]));
    } else {
      // ReadableStream → collect into Blob
      const reader = (file as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) chunks.push(result.value);
      }
      formData.append('file', new Blob(chunks));
    }

    if (options?.overwrite !== undefined) {
      formData.append('overwrite', String(options.overwrite));
    }

    return this.client.httpClient.requestMultipart<FileInfo>(
      'POST',
      `files/${this.projectId}/upload`,
      formData
    );
  }

  /**
   * Get file info (metadata).
   * @param path File path
   */
  async getInfo(path: string): Promise<FileInfo> {
    return this.client.get<FileInfo>(`files/${this.projectId}`, { path });
  }
}
