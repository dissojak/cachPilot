export interface StoredFile {
  id: string;
  url: string;
}

export interface FileStorage {
  save(input: { companyId: string; fileName: string; content: Uint8Array; contentType: string }): Promise<StoredFile>;
  delete(id: string): Promise<void>;
}
