import {
  Company,
  User,
  Membership,
  Party,
  Invoice,
  InvoiceLineProps,
  InvoiceNumber,
  Payment,
  Expense,
  CashMovement,
  Scenario,
  Retainer,
} from "@cashpilot/domain";
import { Money, DateOnly, CompanyId, UserId, PartyId, InvoiceId, PaymentId, ExpenseId, ScenarioId, RetainerId } from "@cashpilot/domain";
import {
  CompanyRepository,
  UserRepository,
  MembershipRepository,
  PartyRepository,
  InvoiceRepository,
  PaymentRepository,
  ExpenseRepository,
  CashMovementRepository,
  ScenarioRepository,
  RetainerRepository,
  AuditLogRepository,
  AuditLogEntry,
} from "@cashpilot/application";
import {
  CompanyModel,
  UserModel,
  MembershipModel,
  PartyModel,
  InvoiceModel,
  PaymentModel,
  ExpenseModel,
  CashMovementModel,
  ScenarioModel,
  RetainerModel,
  AuditLogModel,
} from "@cashpilot/db";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function saveById(id: string, data: Record<string, unknown>, Model: any) {
  const doc = new Model({ _id: id, ...data }, { strict: false });
  const flat = doc.toObject();
  delete flat._id;
  await Model.updateOne({ _id: id }, flat, { upsert: true });
}

export class MongoCompanyRepository implements CompanyRepository {
  async byId(id: CompanyId) {
    const doc = await CompanyModel.findById(id.value).lean() as any;
    if (!doc) return null;
    return Company.restore({
      id: CompanyId.from(doc._id as string),
      name: doc.name,
      sector: doc.sector,
      openingBalance: Money.of(doc.openingBalanceMillimes, "DNT"),
      forecastThreshold: Money.of(doc.forecastThresholdMillimes ?? 0, "DNT"),
    });
  }

  async save(company: Company) {
    await saveById(company.id.value, company.snapshot(), CompanyModel);
  }
}

export class MongoUserRepository implements UserRepository {
  async byId(id: UserId) {
    const doc = await UserModel.findById(id.value).lean() as any;
    if (!doc) return null;
    return User.restore({
      id: UserId.from(doc._id as string),
      email: doc.email,
      name: doc.name,
      oauthProvider: doc.oauthProvider,
      oauthSubject: doc.oauthSubject,
    });
  }

  async byEmail(email: string) {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean() as any;
    if (!doc) return null;
    return User.restore({
      id: UserId.from(doc._id as string),
      email: doc.email,
      name: doc.name,
      oauthProvider: doc.oauthProvider,
      oauthSubject: doc.oauthSubject,
    });
  }

  async save(user: User) {
    await saveById(user.id.value, user.snapshot(), UserModel);
  }
}

export class MongoMembershipRepository implements MembershipRepository {
  private key(userId: UserId, companyId: CompanyId) {
    return `${userId.value}:${companyId.value}`;
  }

  async byUserAndCompany(userId: UserId, companyId: CompanyId) {
    const doc = (await MembershipModel.findById(this.key(userId, companyId)).lean()) as any;
    if (!doc) return null;
    return Membership.restore(UserId.from(doc.userId as string), CompanyId.from(doc.companyId as string), doc.role);
  }

  async listByCompany(companyId: CompanyId) {
    const docs = (await MembershipModel.find({ companyId: companyId.value }).lean()) as any[];
    return docs.map((doc: any) => Membership.restore(UserId.from(doc.userId as string), CompanyId.from(doc.companyId as string), doc.role));
  }

  async listByUser(userId: UserId) {
    const docs = (await MembershipModel.find({ userId: userId.value }).lean()) as any[];
    return docs.map((doc: any) => Membership.restore(UserId.from(doc.userId as string), CompanyId.from(doc.companyId as string), doc.role));
  }

  async save(membership: Membership) {
    await saveById(
      this.key(membership.userId, membership.companyId),
      { userId: membership.userId.value, companyId: membership.companyId.value, role: membership.role },
      MembershipModel,
    );
  }

  async remove(userId: UserId, companyId: CompanyId) {
    await MembershipModel.deleteOne({ _id: this.key(userId, companyId) });
  }
}

export class MongoPartyRepository implements PartyRepository {
  async byId(id: PartyId) {
    const doc = await PartyModel.findById(id.value).lean() as any;
    if (!doc) return null;
    return Party.restore({
      id: PartyId.from(doc._id as string),
      companyId: CompanyId.from(doc.companyId as string),
      type: doc.type,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      address: doc.address,
    });
  }

  async byCompany(companyId: CompanyId) {
    const docs = await PartyModel.find({ companyId: companyId.value }).lean() as any;
    return docs.map((doc: any) =>
      Party.restore({
        id: PartyId.from(doc._id as string),
        companyId: CompanyId.from(doc.companyId as string),
        type: doc.type,
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        address: doc.address,
      }),
    );
  }

  async save(party: Party) {
    await saveById(party.id.value, party.snapshot(), PartyModel);
  }
}

export class MongoInvoiceRepository implements InvoiceRepository {
  private toInvoice(doc: any) {
    const lines: InvoiceLineProps[] = (doc.lines ?? []).map((line: any) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: Money.of(line.unitPriceMillimes, "DNT"),
      lineTotal: Money.of(line.lineTotalMillimes, "DNT"),
    }));
    return Invoice.restore({
      id: InvoiceId.from(doc._id as string),
      companyId: CompanyId.from(doc.companyId as string),
      customerId: PartyId.from(doc.customerId as string),
      number: InvoiceNumber.from(doc.number),
      status: doc.status,
      issueDate: DateOnly.from(doc.issueDate),
      dueDate: DateOnly.from(doc.dueDate),
      lines,
      total: Money.of(doc.totalMillimes, "DNT"),
      remaining: Money.of(doc.remainingMillimes, "DNT"),
      cancelledReason: doc.cancelledReason ?? undefined,
      cancelledBy: doc.cancelledBy ?? undefined,
    });
  }

  async byId(id: InvoiceId) {
    const doc = await InvoiceModel.findById(id.value).lean() as any;
    return doc ? this.toInvoice(doc) : null;
  }

  async byCompany(companyId: CompanyId) {
    const docs = await InvoiceModel.find({ companyId: companyId.value }).lean() as any;
    return docs.map((doc: any) => this.toInvoice(doc));
  }

  async save(invoice: Invoice) {
    await saveById(invoice.id.value, invoice.snapshot(), InvoiceModel);
  }

  async nextNumber(companyId: CompanyId) {
    const count = await InvoiceModel.countDocuments({ companyId: companyId.value });
    return `INV-${count + 1}`;
  }
}

export class MongoPaymentRepository implements PaymentRepository {
  private toPayment(doc: any) {
    return Payment.restore({
      id: PaymentId.from(doc._id as string),
      companyId: CompanyId.from(doc.companyId as string),
      invoiceId: InvoiceId.from(doc.invoiceId as string),
      amount: Money.of(doc.amountMillimes, "DNT"),
      paymentDate: DateOnly.from(doc.paymentDate),
      method: doc.method,
      note: doc.note ?? undefined,
      recordedBy: UserId.from(doc.recordedBy as string),
    });
  }

  async byId(id: PaymentId) {
    const doc = await PaymentModel.findById(id.value).lean() as any;
    return doc ? this.toPayment(doc) : null;
  }

  async byInvoice(invoiceId: InvoiceId) {
    const docs = await PaymentModel.find({ invoiceId: invoiceId.value }).lean() as any;
    return docs.map((doc: any) => this.toPayment(doc));
  }

  async byCompany(companyId: CompanyId) {
    const docs = await PaymentModel.find({ companyId: companyId.value }).lean() as any;
    return docs.map((doc: any) => this.toPayment(doc));
  }

  async save(payment: Payment) {
    await saveById(payment.id.value, payment.snapshot(), PaymentModel);
  }
}

export class MongoExpenseRepository implements ExpenseRepository {
  private toExpense(doc: any) {
    return Expense.restore({
      id: ExpenseId.from(doc._id as string),
      companyId: CompanyId.from(doc.companyId as string),
      submittedBy: UserId.from(doc.submittedBy as string),
      category: doc.category,
      description: doc.description,
      amount: Money.of(doc.amountMillimes, "DNT"),
      expenseDate: DateOnly.from(doc.expenseDate),
      receiptFileId: doc.receiptFileId ?? undefined,
      status: doc.status,
      approval: doc.approval?.approver
        ? {
            approver: UserId.from(doc.approval.approver as string),
            decisionDate: DateOnly.from(doc.approval.decisionDate as string),
            reason: doc.approval.reason ?? undefined,
          }
        : undefined,
      payment: doc.payment?.paidBy
        ? {
            paidBy: UserId.from(doc.payment.paidBy as string),
            paidDate: DateOnly.from(doc.payment.paidDate as string),
            amount: Money.of(doc.payment.amountMillimes as number, "DNT"),
          }
        : undefined,
    });
  }

  async byId(id: ExpenseId) {
    const doc = await ExpenseModel.findById(id.value).lean() as any;
    return doc ? this.toExpense(doc) : null;
  }

  async byCompany(companyId: CompanyId) {
    const docs = await ExpenseModel.find({ companyId: companyId.value }).lean() as any;
    return docs.map((doc: any) => this.toExpense(doc));
  }

  async save(expense: Expense) {
    await saveById(expense.id.value, expense.snapshot(), ExpenseModel);
  }
}

export class MongoCashMovementRepository implements CashMovementRepository {
  async byCompany(companyId: CompanyId) {
    const docs = await CashMovementModel.find({ companyId: companyId.value }).lean() as any;
    return docs.map((doc: any) =>
      CashMovement.restore({
        id: doc._id as string,
        companyId: CompanyId.from(doc.companyId as string),
        type: doc.type,
        amountMillimes: doc.amountMillimes,
        movementDate: DateOnly.from(doc.movementDate),
        sourceType: doc.sourceType,
        sourceId: doc.sourceId as string,
        actorId: UserId.from(doc.actorId as string),
        reason: doc.reason ?? undefined,
      }),
    );
  }

  async save(movement: CashMovement) {
    const data = movement.snapshot();
    await CashMovementModel.updateOne({ _id: data.id }, data, { upsert: true });
  }
}

export class MongoScenarioRepository implements ScenarioRepository {
  async byId(id: ScenarioId) {
    const doc = await ScenarioModel.findById(id.value).lean() as any;
    if (!doc) return null;
    return Scenario.restore({
      id: ScenarioId.from(doc._id as string),
      companyId: CompanyId.from(doc.companyId as string),
      name: doc.name,
      baseReferenceDate: DateOnly.from(doc.baseReferenceDate),
      hypotheses: doc.hypotheses ?? [],
      createdBy: UserId.from(doc.createdBy as string),
    });
  }

  async byCompany(companyId: CompanyId) {
    const docs = await ScenarioModel.find({ companyId: companyId.value }).lean() as any;
    return docs.map((doc: any) =>
      Scenario.restore({
        id: ScenarioId.from(doc._id as string),
        companyId: CompanyId.from(doc.companyId as string),
        name: doc.name,
        baseReferenceDate: DateOnly.from(doc.baseReferenceDate),
        hypotheses: doc.hypotheses ?? [],
        createdBy: UserId.from(doc.createdBy as string),
      }),
    );
  }

  async save(scenario: Scenario) {
    await saveById(scenario.id.value, scenario.snapshot(), ScenarioModel);
  }
}

export class MongoRetainerRepository implements RetainerRepository {
  async byId(id: RetainerId) {
    const doc = await RetainerModel.findById(id.value).lean() as any;
    return doc ? this.toRetainer(doc) : null;
  }

  async byCompany(companyId: CompanyId) {
    const docs = await RetainerModel.find({ companyId: companyId.value }).lean() as any;
    return docs.map((doc: any) => this.toRetainer(doc));
  }

  private toRetainer(doc: any) {
    return Retainer.restore({
      id: RetainerId.from(doc._id as string),
      companyId: CompanyId.from(doc.companyId as string),
      customerId: PartyId.from(doc.customerId as string),
      name: doc.name,
      amount: Money.of(doc.amountMillimes, "DNT"),
      intervalDays: doc.intervalDays,
      nextGenerationDate: DateOnly.from(doc.nextGenerationDate),
      status: doc.status,
    });
  }

  async save(retainer: Retainer) {
    await saveById(retainer.id.value, retainer.snapshot(), RetainerModel);
  }
}

export class MongoAuditLogRepository implements AuditLogRepository {
  async save(entry: AuditLogEntry) {
    const doc = new AuditLogModel(entry);
    await doc.save();
  }

  async byCompany(companyId: string) {
    const docs = (await AuditLogModel.find({ companyId }).lean()) as any[];
    return docs.map((doc: any) => ({
      companyId: doc.companyId,
      actorId: doc.actorId,
      entityType: doc.entityType,
      entityId: doc.entityId,
      action: doc.action,
      before: doc.before,
      after: doc.after,
      reason: doc.reason,
    }));
  }
}
