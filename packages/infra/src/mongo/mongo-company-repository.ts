
import {
  connectDb,
  CompanyModel,
  mongoose,
} from "@cashpilot/db";

import {
  Company,
  CompanyId,
  Money,
} from "@cashpilot/domain";

import type {
  CompanyRepository,
} from "@cashpilot/application";
import { currentMongoSession } from "./mongo-transaction-context";
export class MongoCompanyRepository
  implements CompanyRepository {

  async byId(id: CompanyId): Promise<Company | null> {
    await connectDb();

    if (!mongoose.isValidObjectId(id.value)) {
      return null;
    }

    const document = await CompanyModel
      .findById(id.value)
      .lean();

    if (!document) {
      return null;
    }

    return Company.restore({
      id: CompanyId.from(document._id.toString()),
      name: document.name,
      sector: document.sector,
      openingBalance: Money.of(
        document.openingBalanceMillimes,
        document.currency
      ),
      forecastThreshold: Money.of(
        document.forecastThresholdMillimes,
        document.currency
      ),
    });
  }

  async save(company: Company): Promise<void> {
    await connectDb();

    const data = company.snapshot();

    if (!mongoose.isValidObjectId(data.id)) {
      throw new Error("Invalid MongoDB Company ID");
    }

    await CompanyModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(data.id),
      },
      {
        $set: {
          name: data.name,
          sector: data.sector,
          openingBalanceMillimes:
            data.openingBalanceMillimes,
          forecastThresholdMillimes:
            data.forecastThresholdMillimes,
          currency: company.openingBalance.currency,
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
