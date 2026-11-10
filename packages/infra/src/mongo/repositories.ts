import { connectDb, CompanyModel, UserModel, MembershipModel, PartyModel, InvoiceModel, PaymentModel, ExpenseModel, CashMovementModel, ScenarioModel, RetainerModel, AuditLogModel, CounterModel } from "@cashpilot/db";
import type { Company, User, Membership, Party, Invoice, Expense, Scenario, Retainer } from "@cashpilot/domain";
import type { CompanyId, UserId, PartyId, InvoiceId, PaymentId, ExpenseId, ScenarioId, RetainerId } from "@cashpilot/domain";
import type {
  CompanyRepository, UserRepository, MembershipRepository, PartyRepository, InvoiceRepository, PaymentRepository,
  ExpenseRepository, CashMovementRepository, ScenarioRepository, RetainerRepository, AuditLogRepository, AuditLogEntry,
} from "@cashpilot/application";
import {
  companyMapper, userMapper, membershipMapper, partyMapper, invoiceMapper, paymentMapper, expenseMapper,
  cashMovementMapper, scenarioMapper, retainerMapper,
} from "./mappers";

/**
 * MongoDB adapters. Each method connects lazily (connectDb is cached), so
 * the web app never has to know about the database connection.
 * Mutable aggregates are replaced whole; payments and cash movements are
 * written only by MongoFinancialLedger (append-only).
 */

export class MongoCompanyRepository implements CompanyRepository {
  async byId(id: CompanyId) {
    await connectDb();
    const doc = await CompanyModel.findById(id.value).lean();
    return doc ? companyMapper.toDomain(doc) : null;
  }
  async save(company: Company) {
    await connectDb();
    const doc = companyMapper.toDoc(company);
    await CompanyModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
}

export class MongoUserRepository implements UserRepository {
  async byId(id: UserId) {
    await connectDb();
    const doc = await UserModel.findById(id.value).lean();
    return doc ? userMapper.toDomain(doc) : null;
  }
  async byEmail(email: string) {
    await connectDb();
    const doc = await UserModel.findOne({ email: email.trim().toLowerCase() }).lean();
    return doc ? userMapper.toDomain(doc) : null;
  }
  async save(user: User) {
    await connectDb();
    const doc = userMapper.toDoc(user);
    await UserModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
}

export class MongoMembershipRepository implements MembershipRepository {
  async byUserAndCompany(userId: UserId, companyId: CompanyId) {
    await connectDb();
    const doc = await MembershipModel.findById(membershipMapper.key(userId.value, companyId.value)).lean();
    return doc ? membershipMapper.toDomain(doc) : null;
  }
  async listByCompany(companyId: CompanyId) {
    await connectDb();
    return (await MembershipModel.find({ companyId: companyId.value }).lean()).map(membershipMapper.toDomain);
  }
  async listByUser(userId: UserId) {
    await connectDb();
    return (await MembershipModel.find({ userId: userId.value }).lean()).map(membershipMapper.toDomain);
  }
  async save(membership: Membership) {
    await connectDb();
    const doc = membershipMapper.toDoc(membership);
    await MembershipModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
  async remove(userId: UserId, companyId: CompanyId) {
    await connectDb();
    await MembershipModel.deleteOne({ _id: membershipMapper.key(userId.value, companyId.value) });
  }
}

export class MongoPartyRepository implements PartyRepository {
  async byId(id: PartyId) {
    await connectDb();
    const doc = await PartyModel.findById(id.value).lean();
    return doc ? partyMapper.toDomain(doc) : null;
  }
  async byCompany(companyId: CompanyId) {
    await connectDb();
    return (await PartyModel.find({ companyId: companyId.value }).sort({ name: 1 }).lean()).map(partyMapper.toDomain);
  }
  async save(party: Party) {
    await connectDb();
    const doc = partyMapper.toDoc(party);
    await PartyModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
}

export class MongoInvoiceRepository implements InvoiceRepository {
  async byId(id: InvoiceId) {
    await connectDb();
    const doc = await InvoiceModel.findById(id.value).lean();
    return doc ? invoiceMapper.toDomain(doc) : null;
  }
  async byCompany(companyId: CompanyId) {
    await connectDb();
    return (await InvoiceModel.find({ companyId: companyId.value }).lean()).map(invoiceMapper.toDomain);
  }
  async save(invoice: Invoice) {
    await connectDb();
    const doc = invoiceMapper.toDoc(invoice);
    await InvoiceModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
  /** Atomic $inc on a per-company counter: two users never get the same number (D6). */
  async nextNumber(companyId: CompanyId) {
    await connectDb();
    const key = `${companyId.value}:invoice`;
    const existing = await CounterModel.findById(key).lean();
    if (!existing) {
      // first use: start after the invoices that existed before the counter
      const count = await InvoiceModel.countDocuments({ companyId: companyId.value });
      await CounterModel.updateOne({ _id: key }, { $setOnInsert: { seq: count } }, { upsert: true });
    }
    const counter = await CounterModel.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true }).lean();
    return `INV-${String(counter?.seq ?? 1).padStart(4, "0")}`;
  }
}

export class MongoPaymentRepository implements PaymentRepository {
  async byId(id: PaymentId) {
    await connectDb();
    const doc = await PaymentModel.findById(id.value).lean();
    return doc ? paymentMapper.toDomain(doc) : null;
  }
  async byInvoice(invoiceId: InvoiceId) {
    await connectDb();
    return (await PaymentModel.find({ invoiceId: invoiceId.value }).lean()).map(paymentMapper.toDomain);
  }
  async byCompany(companyId: CompanyId) {
    await connectDb();
    return (await PaymentModel.find({ companyId: companyId.value }).lean()).map(paymentMapper.toDomain);
  }
}

export class MongoExpenseRepository implements ExpenseRepository {
  async byId(id: ExpenseId) {
    await connectDb();
    const doc = await ExpenseModel.findById(id.value).lean();
    return doc ? expenseMapper.toDomain(doc) : null;
  }
  async byCompany(companyId: CompanyId) {
    await connectDb();
    return (await ExpenseModel.find({ companyId: companyId.value }).lean()).map(expenseMapper.toDomain);
  }
  async save(expense: Expense) {
    await connectDb();
    const doc = expenseMapper.toDoc(expense);
    await ExpenseModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
}

export class MongoCashMovementRepository implements CashMovementRepository {
  async byCompany(companyId: CompanyId) {
    await connectDb();
    return (await CashMovementModel.find({ companyId: companyId.value }).sort({ movementDate: 1 }).lean()).map(cashMovementMapper.toDomain);
  }
}

export class MongoScenarioRepository implements ScenarioRepository {
  async byId(id: ScenarioId) {
    await connectDb();
    const doc = await ScenarioModel.findById(id.value).lean();
    return doc ? scenarioMapper.toDomain(doc) : null;
  }
  async byCompany(companyId: CompanyId) {
    await connectDb();
    return (await ScenarioModel.find({ companyId: companyId.value }).sort({ createdAt: -1 }).lean()).map(scenarioMapper.toDomain);
  }
  async save(scenario: Scenario) {
    await connectDb();
    const doc = scenarioMapper.toDoc(scenario);
    await ScenarioModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
}

export class MongoRetainerRepository implements RetainerRepository {
  async byId(id: RetainerId) {
    await connectDb();
    const doc = await RetainerModel.findById(id.value).lean();
    return doc ? retainerMapper.toDomain(doc) : null;
  }
  async byCompany(companyId: CompanyId) {
    await connectDb();
    return (await RetainerModel.find({ companyId: companyId.value }).lean()).map(retainerMapper.toDomain);
  }
  async save(retainer: Retainer) {
    await connectDb();
    const doc = retainerMapper.toDoc(retainer);
    await RetainerModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }
}

export class MongoAuditLogRepository implements AuditLogRepository {
  async append(entry: AuditLogEntry) {
    await connectDb();
    await AuditLogModel.create(entry);
  }
  async byCompany(companyId: string) {
    await connectDb();
    const docs = await AuditLogModel.find({ companyId }).sort({ at: -1 }).lean();
    return docs.map((doc) => ({ ...doc, action: doc.action as AuditLogEntry["action"] }));
  }
}
