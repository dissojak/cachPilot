
import { AsyncLocalStorage } from "node:async_hooks";
import type { ClientSession } from "mongoose";

export const mongoTransactionContext:
  AsyncLocalStorage<ClientSession> =
    new AsyncLocalStorage<ClientSession>();

export function currentMongoSession():
  ClientSession | undefined {
  return mongoTransactionContext.getStore();
}
