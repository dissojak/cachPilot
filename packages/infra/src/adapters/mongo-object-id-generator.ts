
import type { IdGenerator } from "@cashpilot/application";
import { mongoose } from "@cashpilot/db";

export class MongoObjectIdGenerator implements IdGenerator {
  newId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }
}
