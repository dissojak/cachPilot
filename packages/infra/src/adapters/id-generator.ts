import type { IdGenerator } from "@cashpilot/application";

export class CryptoIdGenerator implements IdGenerator {
  newId() { return crypto.randomUUID(); }
}
