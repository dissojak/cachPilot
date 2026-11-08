
import type {
  TransactionManager,
} from "@cashpilot/application";

import {
  connectDb,
  mongoose,
} from "@cashpilot/db";

import {
  mongoTransactionContext,
} from "./mongo-transaction-context";

export class MongoTransactionManager
  implements TransactionManager {

  async run<T>(
    work: () => Promise<T>
  ): Promise<T> {
    await connectDb();

    return mongoose.connection.transaction(
      async (session) => {
        return mongoTransactionContext.run(
          session,
          work
        );
      }
    );
  }
}
