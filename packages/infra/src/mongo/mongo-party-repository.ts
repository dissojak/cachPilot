
import {
  connectDb,
  PartyModel,
  mongoose,
} from "@cashpilot/db";

import {
  CompanyId,
  PartyId,
  Party,
} from "@cashpilot/domain";

import type {
  PartyRepository,
} from "@cashpilot/application";

import {
  currentMongoSession,
} from "./mongo-transaction-context";

export class MongoPartyRepository
  implements PartyRepository {

  private toDomain(document: {
    _id: unknown;
    companyId: unknown;
    type: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }): Party {
    return Party.restore({
      id: PartyId.from(String(document._id)),
      companyId: CompanyId.from(
        String(document.companyId)
      ),
      type: document.type as "customer" | "supplier",
      name: document.name,
      email: document.email ?? undefined,
      phone: document.phone ?? undefined,
      address: document.address ?? undefined,
    });
  }

  async byId(id: PartyId): Promise<Party | null> {
    await connectDb();

    if (!mongoose.isObjectIdOrHexString(id.value)) {
      return null;
    }

    const document = await PartyModel
      .findById(id.value)
      .session(currentMongoSession() ?? null)
      .lean();

    if (!document) {
      return null;
    }

    return this.toDomain(document);
  }

  async byCompany(
    companyId: CompanyId
  ): Promise<Party[]> {
    await connectDb();

    if (
      !mongoose.isObjectIdOrHexString(companyId.value)
    ) {
      return [];
    }

    const documents = await PartyModel.find({
      companyId: new mongoose.Types.ObjectId(
        companyId.value
      ),
    })
      .session(currentMongoSession() ?? null)
      .lean();

    return documents.map((document) =>
      this.toDomain(document)
    );
  }

  async save(party: Party): Promise<void> {
    await connectDb();

    const data = party.snapshot();

    if (
      !mongoose.isObjectIdOrHexString(data.id) ||
      !mongoose.isObjectIdOrHexString(data.companyId)
    ) {
      throw new Error("Invalid MongoDB Party IDs");
    }

    await PartyModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(data.id),
        companyId: new mongoose.Types.ObjectId(
          data.companyId
        ),
      },
      {
        $set: {
          type: data.type,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        },
        $setOnInsert: {
          companyId: new mongoose.Types.ObjectId(
            data.companyId
          ),
        },
      },
      {
        upsert: true,
        runValidators: true,
        session: currentMongoSession(),
      }
    );
  }
}
