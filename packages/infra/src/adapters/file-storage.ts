import { FileStorage, StoredFile } from "@cashpilot/application";

export class InMemoryFileStorage implements FileStorage {
  private readonly files = new Map<string, StoredFile>();
  async save(input: { companyId: string; fileName: string; content: Uint8Array; contentType: string }) {
    const id = crypto.randomUUID();
    const file = { id, url: `memory://${input.companyId}/${input.fileName}` };
    this.files.set(id, file);
    return file;
  }
  async delete(id: string) { this.files.delete(id); }
}
