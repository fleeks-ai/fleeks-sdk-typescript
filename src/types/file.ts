export interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory' | 'symlink';
  sizeBytes: number;
  permissions: string;
  createdAt: string;
  modifiedAt: string;
  mimeType?: string;
}

export interface DirectoryListing {
  projectId: string;
  path: string;
  totalCount: number;
  files: FileInfo[];
}

export interface CreateFileOptions {
  encoding?: string;
  permissions?: string;
}

export interface UpdateFileOptions {
  encoding?: string;
  createIfMissing?: boolean;
}

export interface ListFilesOptions {
  recursive?: boolean;
  includeHidden?: boolean;
}

export interface MkdirOptions {
  parents?: boolean;
  permissions?: string;
}

export interface UploadFileOptions {
  overwrite?: boolean;
}
