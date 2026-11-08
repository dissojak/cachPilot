import { TransactionManager } from "@cashpilot/application";

export class NoopTransactionManager implements TransactionManager {
  async run<T>(work: () => Promise<T>) { return work(); }
}
