
import {
  connectDb,
  InvoiceModel,
  mongoose,
} from "@cashpilot/db";

import {
  CompanyId,
  PartyId,
  InvoiceId,
  Invoice,
  InvoiceNumber,
  DateOnly,
  Money,
} from "@cashpilot/domain";

import type {
  InvoiceStatus,
} from "@cashpilot/domain";

import type {
  InvoiceRepository,
} from "@cashpilot/application";

import {
  currentMongoSession,
} from "./mongo-transaction-context";

export class MongoInvoiceRepository
  implements InvoiceRepository {

  private toDomain(document: {
    _id: unknown;
    companyId: unknown;
    customerId: unknown;
    number: string;
    status: string;
    issueDate: Date;
    dueDate: Date;
    lines: {
      description: string;
      quantity: number;
      unitPriceMillimes: number;
      lineTotalMillimes: number;
    }[];
    totalMillimes: number;
    remainingMillimes: number;
    cancelledReason?: string | null;
  }): Invoice {
    return Invoice.restore({
      id: InvoiceId.from(String(document._id)),
      companyId: CompanyId.from(
        String(document.companyId)
      ),
      customerId: PartyId.from(
        String(document.customerId)
      ),
      number: InvoiceNumber.from(document.number),
      status: document.status as InvoiceStatus,
      issueDate: DateOnly.from(
        document.issueDate.toISOString().slice(0, 10)
      ),
      dueDate: DateOnly.from(
        document.dueDate.toISOString().slice(0, 10)
      ),
      lines: document.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: Money.of(line.unitPriceMillimes),
        lineTotal: Money.of(line.lineTotalMillimes),
      })),
      total: Money.of(document.totalMillimes),
      remaining: Money.of(document.remainingMillimes),
      cancelledReason:
        document.cancelledReason ?? undefined,
    });
  }

  async byId(
    id: InvoiceId
  ): Promise<Invoice | null> {
    await connectDb();

    if (!mongoose.isObjectIdOrHexString(id.value)) {
      return null;
    }

    const document = await InvoiceModel
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
  ): Promise<Invoice[]> {
    await connectDb();

    if (
      !mongoose.isObjectIdOrHexString(companyId.value)
    ) {
      return [];
    }

    const documents = await InvoiceModel.find({
      companyId: new mongoose.Types.ObjectId(
        companyId.value
      ),
    })
      .sort({ createdAt: -1 })
      .session(currentMongoSession() ?? null)
      .lean();

    return documents.map((document) =>
      this.toDomain(document)
    );
  }

  async save(invoice: Invoice): Promise<void> {
    await connectDb();

    const data = invoice.snapshot();

    if (
      !mongoose.isObjectIdOrHexString(data.id) ||
      !mongoose.isObjectIdOrHexString(data.companyId) ||
      !mongoose.isObjectIdOrHexString(data.customerId)
    ) {
      throw new Error("Invalid MongoDB Invoice IDs");
    }

    await InvoiceModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(data.id),
        companyId: new mongoose.Types.ObjectId(
          data.companyId
        ),
      },
      {
        $set: {
          customerId: new mongoose.Types.ObjectId(
            data.customerId
          ),
          number: data.number,
          status: data.status,
          issueDate: new Date(
            `${data.issueDate}T00:00:00.000Z`
          ),
          dueDate: new Date(
            `${data.dueDate}T00:00:00.000Z`
          ),
          lines: data.lines,
          totalMillimes: data.totalMillimes,
          remainingMillimes: data.remainingMillimes,
          cancelledReason: data.cancelledReason,
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

  async nextNumber(
    companyId: CompanyId
  ): Promise<string> {
    await connectDb();

    if (
      !mongoose.isObjectIdOrHexString(companyId.value)
    ) {
      throw new Error("Invalid MongoDB Company ID");
    }

    return (
      "FAC-" +
      new mongoose.Types.ObjectId()
        .toHexString()
        .toUpperCase()
    );
  }
}
