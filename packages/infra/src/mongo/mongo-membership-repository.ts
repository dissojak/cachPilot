
import {
  connectDb,
  MembershipModel,
  mongoose,
} from "@cashpilot/db";

import {
  Membership,
  CompanyId,
  UserId,
} from "@cashpilot/domain";

import type {
  MembershipRole,
} from "@cashpilot/domain";

import type {
  MembershipRepository,
} from "@cashpilot/application";
import { currentMongoSession } from "./mongo-transaction-context";
export class MongoMembershipRepository
  implements MembershipRepository {

  async byUserAndCompany(
    userId: UserId,
    companyId: CompanyId
  ): Promise<Membership | null> {
    await connectDb();

    if (
      !mongoose.isObjectIdOrHexString(userId.value) ||
      !mongoose.isObjectIdOrHexString(companyId.value)
    ) {
      return null;
    }

    const document = await MembershipModel.findOne({
      userId: new mongoose.Types.ObjectId(
        userId.value
      ),
      companyId: new mongoose.Types.ObjectId(
        companyId.value
      ),
    }).lean();

    if (!document) {
      return null;
    }

    return this.toDomain(document);
  }

  async listByCompany(
    companyId: CompanyId
  ): Promise<Membership[]> {
    await connectDb();

    if (
      !mongoose.isObjectIdOrHexString(companyId.value)
    ) {
      return [];
    }

    const documents = await MembershipModel.find({
      companyId: new mongoose.Types.ObjectId(
        companyId.value
      ),
    }).lean();

    return documents.map((document) =>
      this.toDomain(document)
    );
  }

  async save(
    membership: Membership
  ): Promise<void> {
    await connectDb();

    const userId = membership.userId.value;
    const companyId = membership.companyId.value;

    if (
      !mongoose.isObjectIdOrHexString(userId) ||
      !mongoose.isObjectIdOrHexString(companyId)
    ) {
      throw new Error(
        "Invalid MongoDB Membership IDs"
      );
    }

    await MembershipModel.updateOne(
      {
        userId: new mongoose.Types.ObjectId(userId),
        companyId: new mongoose.Types.ObjectId(
          companyId
        ),
      },
      {
        $set: {
          role: membership.role,
        },
      },
      {
        upsert: true,
        runValidators: true,
        session: currentMongoSession(),
      }
    );
  }

  async remove(
    userId: UserId,
    companyId: CompanyId
  ): Promise<void> {
    await connectDb();

    if (
      !mongoose.isObjectIdOrHexString(userId.value) ||
      !mongoose.isObjectIdOrHexString(companyId.value)
    ) {
      throw new Error(
        "Invalid MongoDB Membership IDs"
      );
    }

    await MembershipModel.deleteOne({
      userId: new mongoose.Types.ObjectId(
        userId.value
      ),
      companyId: new mongoose.Types.ObjectId(
        companyId.value
      ),
    });
  }

  private toDomain(document: {
    userId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    role: string;
  }): Membership {
    return Membership.restore(
      UserId.from(document.userId.toString()),
      CompanyId.from(
        document.companyId.toString()
      ),
      document.role as MembershipRole
    );
  }
  
async listByUser(
  userId: UserId
): Promise<Membership[]> {
  await connectDb();

  if (!mongoose.isObjectIdOrHexString(userId.value)) {
    return [];
  }

  const documents = await MembershipModel.find({
    userId: new mongoose.Types.ObjectId(userId.value),
  }).lean();

  return documents.map((document) =>
    this.toDomain(document)
  );
}

}
