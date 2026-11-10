import {
  Company, User, Membership, Party, Invoice, InvoiceNumber, Payment, Expense, CashMovement, Scenario, Retainer,
  Money, DateOnly, CompanyId, UserId, PartyId, InvoiceId, PaymentId, ExpenseId, ScenarioId, RetainerId, CashMovementId,
} from "@cashpilot/domain";
import type { Hypothesis } from "@cashpilot/domain";
import type {
  CompanyDoc, UserDoc, MembershipDoc, PartyDoc, InvoiceDoc, PaymentDoc, ExpenseDoc, CashMovementDoc,
  ScenarioDoc, HypothesisDoc, RetainerDoc,
} from "@cashpilot/db";

/**
 * Two models, kept apart (course s.27): documents are plain stored data,
 * entities carry the rules. Documents never leave packages/infra.
 * toDoc() is built from the entity snapshot; toDomain() goes through restore().
 */

function withoutId<T extends { id: string }>(snapshot: T): Omit<T, "id"> & { _id: string } {
  const { id, ...rest } = snapshot;
  return { _id: id, ...rest };
}

export const companyMapper = {
  toDoc: (company: Company): CompanyDoc => withoutId(company.snapshot()),
  toDomain: (doc: CompanyDoc) => Company.restore({
    id: CompanyId.from(doc._id),
    name: doc.name,
    sector: doc.sector,
    forecastThreshold: Money.of(doc.forecastThresholdMillimes ?? 0),
  }),
};

export const userMapper = {
  toDoc: (user: User): UserDoc => withoutId(user.snapshot()),
  toDomain: (doc: UserDoc) => User.restore({
    id: UserId.from(doc._id), email: doc.email, name: doc.name, oauthProvider: doc.oauthProvider, oauthSubject: doc.oauthSubject,
  }),
};

export const membershipMapper = {
  key: (userId: string, companyId: string) => `${userId}:${companyId}`,
  toDoc: (membership: Membership): MembershipDoc => ({
    _id: membershipMapper.key(membership.userId.value, membership.companyId.value),
    userId: membership.userId.value,
    companyId: membership.companyId.value,
    role: membership.role,
  }),
  toDomain: (doc: MembershipDoc) => Membership.restore(UserId.from(doc.userId), CompanyId.from(doc.companyId), doc.role),
};

export const partyMapper = {
  toDoc: (party: Party): PartyDoc => withoutId(party.snapshot()),
  toDomain: (doc: PartyDoc) => Party.restore({
    id: PartyId.from(doc._id), companyId: CompanyId.from(doc.companyId), type: doc.type,
    name: doc.name, email: doc.email ?? undefined, phone: doc.phone ?? undefined, address: doc.address ?? undefined,
  }),
};

export const invoiceMapper = {
  toDoc: (invoice: Invoice): InvoiceDoc => withoutId(invoice.snapshot()),
  toDomain: (doc: InvoiceDoc) => Invoice.restore({
    id: InvoiceId.from(doc._id),
    companyId: CompanyId.from(doc.companyId),
    customerId: PartyId.from(doc.customerId),
    number: InvoiceNumber.from(doc.number),
    status: doc.status,
    issueDate: DateOnly.from(doc.issueDate),
    dueDate: DateOnly.from(doc.dueDate),
    lines: doc.lines.map((line) => ({ description: line.description, quantity: line.quantity, unitPrice: Money.of(line.unitPriceMillimes) })),
    total: Money.of(doc.totalMillimes),
    remaining: Money.of(doc.remainingMillimes),
    cancelledReason: doc.cancelledReason ?? undefined,
    cancelledBy: doc.cancelledBy ?? undefined,
    cancelledAt: doc.cancelledAt ? DateOnly.from(doc.cancelledAt) : undefined,
  }),
};

export const paymentMapper = {
  toDoc: (payment: Payment): PaymentDoc => withoutId(payment.snapshot()),
  toDomain: (doc: PaymentDoc) => Payment.restore({
    id: PaymentId.from(doc._id),
    companyId: CompanyId.from(doc.companyId),
    invoiceId: InvoiceId.from(doc.invoiceId),
    amount: Money.of(doc.amountMillimes),
    paymentDate: DateOnly.from(doc.paymentDate),
    method: doc.method,
    note: doc.note ?? undefined,
    recordedBy: UserId.from(doc.recordedBy),
  }),
};

export const expenseMapper = {
  toDoc: (expense: Expense): ExpenseDoc => withoutId(expense.snapshot()),
  toDomain: (doc: ExpenseDoc) => Expense.restore({
    id: ExpenseId.from(doc._id),
    companyId: CompanyId.from(doc.companyId),
    submittedBy: UserId.from(doc.submittedBy),
    category: doc.category,
    description: doc.description,
    amount: Money.of(doc.amountMillimes),
    expenseDate: DateOnly.from(doc.expenseDate),
    receiptFileId: doc.receiptFileId ?? undefined,
    status: doc.status,
    approval: doc.approval?.approver && doc.approval.decisionDate
      ? { approver: UserId.from(doc.approval.approver), decisionDate: DateOnly.from(doc.approval.decisionDate), reason: doc.approval.reason ?? undefined }
      : undefined,
    payment: doc.payment?.paidBy && doc.payment.paidDate
      ? { paidBy: UserId.from(doc.payment.paidBy), paidDate: DateOnly.from(doc.payment.paidDate) }
      : undefined,
  }),
};

export const cashMovementMapper = {
  toDoc: (movement: CashMovement): CashMovementDoc => withoutId(movement.snapshot()),
  toDomain: (doc: CashMovementDoc) => CashMovement.restore({
    id: CashMovementId.from(doc._id),
    companyId: CompanyId.from(doc.companyId),
    type: doc.type,
    amount: Money.of(doc.amountMillimes),
    movementDate: DateOnly.from(doc.movementDate),
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
    actorId: UserId.from(doc.actorId),
    reason: doc.reason ?? undefined,
    reversesId: doc.reversesId ? CashMovementId.from(doc.reversesId) : undefined,
  }),
};

function hypothesisToDomain(doc: HypothesisDoc): Hypothesis {
  if (doc.type === "client_delay") {
    return { type: "client_delay", invoiceId: doc.invoiceId ?? "", delayDays: doc.delayDays ?? 0 };
  }
  // older documents used plannedDate/expectedDate/description
  return {
    type: doc.type,
    amount: Money.of(doc.amountMillimes ?? 0),
    date: DateOnly.from(doc.date ?? doc.plannedDate ?? doc.expectedDate ?? ""),
    label: doc.label ?? doc.description ?? doc.type,
  };
}

export const scenarioMapper = {
  toDoc: (scenario: Scenario): ScenarioDoc => withoutId(scenario.snapshot()),
  toDomain: (doc: ScenarioDoc) => Scenario.restore({
    id: ScenarioId.from(doc._id),
    companyId: CompanyId.from(doc.companyId),
    name: doc.name,
    baseReferenceDate: DateOnly.from(doc.baseReferenceDate),
    hypotheses: (doc.hypotheses ?? []).map(hypothesisToDomain),
    createdBy: UserId.from(doc.createdBy),
  }),
};

export const retainerMapper = {
  toDoc: (retainer: Retainer): RetainerDoc => withoutId(retainer.snapshot()),
  toDomain: (doc: RetainerDoc) => Retainer.restore({
    id: RetainerId.from(doc._id),
    companyId: CompanyId.from(doc.companyId),
    customerId: PartyId.from(doc.customerId),
    name: doc.name,
    amount: Money.of(doc.amountMillimes),
    intervalDays: doc.intervalDays,
    nextGenerationDate: DateOnly.from(doc.nextGenerationDate),
    status: doc.status,
  }),
};
