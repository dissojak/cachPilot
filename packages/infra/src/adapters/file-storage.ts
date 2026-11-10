import { createHash } from "node:crypto";
import type { FileStorage, StoredFile } from "@cashpilot/application";

/** Demo/E2E storage: files live in memory for the life of the server. */
export class InMemoryFileStorage implements FileStorage {
  private readonly files = new Map<string, StoredFile>();
  async save(input: { companyId: string; fileName: string; content: Uint8Array; contentType: string }) {
    const id = `memory-${this.files.size + 1}-${input.fileName}`;
    const file = { id, url: `data:${input.contentType};base64,${Buffer.from(input.content).toString("base64")}` };
    this.files.set(id, file);
    return file;
  }
  async delete(id: string) { this.files.delete(id); }
}

/**
 * D15: receipts on Cloudinary through its signed upload REST API.
 * CLOUDINARY_URL has the form cloudinary://<api_key>:<api_secret>@<cloud_name>.
 */
export class CloudinaryFileStorage implements FileStorage {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly cloudName: string;

  constructor(cloudinaryUrl: string, private readonly folder = "cashpilot") {
    const url = new URL(cloudinaryUrl);
    this.apiKey = decodeURIComponent(url.username);
    this.apiSecret = decodeURIComponent(url.password);
    this.cloudName = url.hostname;
  }

  async save(input: { companyId: string; fileName: string; content: Uint8Array; contentType: string }): Promise<StoredFile> {
    const params = { folder: `${this.folder}/${input.companyId}`, timestamp: String(Math.floor(Date.now() / 1000)) };
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(input.content)], { type: input.contentType }), input.fileName);
    form.append("api_key", this.apiKey);
    form.append("signature", this.sign(params));
    for (const [key, value] of Object.entries(params)) form.append(key, value);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`, { method: "POST", body: form });
    if (!response.ok) throw new Error(`Cloudinary upload failed (${response.status})`);
    const body = (await response.json()) as { public_id: string; secure_url: string };
    return { id: body.public_id, url: body.secure_url };
  }

  async delete(id: string) {
    const params = { public_id: id, timestamp: String(Math.floor(Date.now() / 1000)) };
    const form = new FormData();
    form.append("api_key", this.apiKey);
    form.append("signature", this.sign(params));
    for (const [key, value] of Object.entries(params)) form.append(key, value);
    await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`, { method: "POST", body: form });
  }

  /** Cloudinary signature: sha1 of the sorted parameters followed by the secret. */
  private sign(params: Record<string, string>) {
    const payload = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
    return createHash("sha1").update(payload + this.apiSecret).digest("hex");
  }
}
