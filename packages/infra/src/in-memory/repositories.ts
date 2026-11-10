import { DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { Company, User, Membership, Party, Invoice, Expense, Scenario, Retainer, Payment, CashMovement, Money } from "@cashpilot/domain";
import type { CompanyId, UserId, PartyId, InvoiceId, PaymentId, ExpenseId, ScenarioId, RetainerId } from "@cashpilot/domain";
import type {
  CompanyRepository, UserRepository, MembershipRepository, PartyRepository, InvoiceRepository, PaymentRepository,
  ExpenseRepository, CashMovementRepository, ScenarioRepository, RetainerRepository, AuditLogRepository, AuditLogEntry,
  FinancialLedger,
} from "@cashpilot/application";
import type {
  CompanyDoc, UserDoc, MembershipDoc, PartyDoc, InvoiceDoc, PaymentDoc, ExpenseDoc, CashMovementDoc, ScenarioDoc, RetainerDoc,
} from "@cashpilot/db";
import {
  companyMapper, userMapper, membershipMapper, partyMapper, invoiceMapper, paymentMapper, expenseMapper,
  cashMovementMapper, scenarioMapper, retainerMapper,
} from "../mongo/mappers";

/**
 * In-memory adapters for demo mode and E2E (no DATABASE_URL). They store the
 * same documents as MongoDB through the same mappers, so a saved entity is a
 * copy, exactly like a real database.
 */
class DocStore<D extends { _id: string }> {
  readonly docs = new Map<string, D>();
  get(id: string) { const doc = this.docs.get(id); return doc ? structuredClone(doc) : undefined; }
  put(doc: D) { this.docs.set(doc._id, structuredClone(doc)); }
  filter(test: (doc: D) => boolean) { return [...this.docs.values()].filter(test).map((doc) => structuredClone(doc)); }
}

export class InMemoryCompanyRepository implements CompanyRepository {
  readonly store = new DocStore<CompanyDoc>();
  async byId(id: CompanyId) { const doc = this.store.get(id.value); return doc ? companyMapper.toDomain(doc) : null; }
  async save(company: Company) { this.store.put(companyMapper.toDoc(company)); }
}

export class InMemoryUserRepository implements UserRepository {
  readonly store = new DocStore<UserDoc>();
  async byId(id: UserId) { const doc = this.store.get(id.value); return doc ? userMapper.toDomain(doc) : null; }
  async byEmail(email: string) {
    const doc = this.store.filter((item) => item.email === email.trim().toLowerCase())[0];
    return doc ? userMapper.toDomain(doc) : null;
  }
  async save(user: User) { this.store.put(userMapper.toDoc(user)); }
}

export class InMemoryMembershipRepository implements MembershipRepository {
  readonly store = new DocStore<MembershipDoc>();
  async byUserAndCompany(userId: UserId, companyId: CompanyId) {
    const doc = this.store.get(membershipMapper.key(userId.value, companyId.value));
    return doc ? membershipMapper.toDomain(doc) : null;
  }
  async listByCompany(companyId: CompanyId) { return this.store.filter((doc) => doc.companyId === companyId.value).map(membershipMapper.toDomain); }
  async listByUser(userId: UserId) { return this.store.filter((doc) => doc.userId === userId.value).map(membershipMapper.toDomain); }
  async save(membership: Membership) { this.store.put(membershipMapper.toDoc(membership)); }
  async remove(userId: UserId, companyId: CompanyId) { this.store.docs.delete(membershipMapper.key(userId.value, companyId.value)); }
}

export class InMemoryPartyRepository implements PartyRepository {
  readonly store = new DocStore<PartyDoc>();
  async byId(id: PartyId) { const doc = this.store.get(id.value); return doc ? partyMapper.toDomain(doc) : null; }
  async byCompany(companyId: CompanyId) {
    return this.store.filter((doc) => doc.companyId === companyId.value).sort((a, b) => a.name.localeCompare(b.name)).map(partyMapper.toDomain);
  }
  async save(party: Party) { this.store.put(partyMapper.toDoc(party)); }
}

export class InMemoryInvoiceRepository implements InvoiceRepository {
  readonly store = new DocStore<InvoiceDoc>();
  private readonly counters = new Map<string, number>();
  async byId(id: InvoiceId) { const doc = this.store.get(id.value); return doc ? invoiceMapper.toDomain(doc) : null; }
  async byCompany(companyId: CompanyId) { return this.store.filter((doc) => doc.companyId === companyId.value).map(invoiceMapper.toDomain); }
  async save(invoice: Invoice) { this.store.put(invoiceMapper.toDoc(invoice)); }
  async nextNumber(companyId: CompanyId) {
    const start = this.counters.get(companyId.value) ?? this.store.filter((doc) => doc.companyId === companyId.value).length;
    this.counters.set(companyId.value, start + 1);
    return `INV-${String(start + 1).padStart(4, "0")}`;
  }
}

export class InMemoryPaymentRepository implements PaymentRepository {
  readonly store = new DocStore<PaymentDoc>();
  async byId(id: PaymentId) { const doc = this.store.get(id.value); return doc ? paymentMapper.toDomain(doc) : null; }
  async byInvoice(invoiceId: InvoiceId) { return this.store.filter((doc) => doc.invoiceId === invoiceId.value).map(paymentMapper.toDomain); }
  async byCompany(companyId: CompanyId) { return this.store.filter((doc) => doc.companyId === companyId.value).map(paymentMapper.toDomain); }
}

export class InMemoryExpenseRepository implements ExpenseRepository {
  readonly store = new DocStore<ExpenseDoc>();
  async byId(id: ExpenseId) { const doc = this.store.get(id.value); return doc ? expenseMapper.toDomain(doc) : null; }
  async byCompany(companyId: CompanyId) { return this.store.filter((doc) => doc.companyId === companyId.value).map(expenseMapper.toDomain); }
  async save(expense: Expense) { this.store.put(expenseMapper.toDoc(expense)); }
}

export class InMemoryCashMovementRepository implements CashMovementRepository {
  readonly store = new DocStore<CashMovementDoc>();
  async byCompany(companyId: CompanyId) {
    return this.store.filter((doc) => doc.companyId === companyId.value)
      .sort((a, b) => a.movementDate.localeCompare(b.movementDate))
      .map(cashMovementMapper.toDomain);
  }
}

export class InMemoryScenarioRepository implements ScenarioRepository {
  readonly store = new DocStore<ScenarioDoc>();
  async byId(id: ScenarioId) { const doc = this.store.get(id.value); return doc ? scenarioMapper.toDomain(doc) : null; }
  async byCompany(companyId: CompanyId) { return this.store.filter((doc) => doc.companyId === companyId.value).map(scenarioMapper.toDomain); }
  async save(scenario: Scenario) { this.store.put(scenarioMapper.toDoc(scenario)); }
}

export class InMemoryRetainerRepository implements RetainerRepository {
  readonly store = new DocStore<RetainerDoc>();
  async byId(id: RetainerId) { const doc = this.store.get(id.value); return doc ? retainerMapper.toDomain(doc) : null; }
  async byCompany(companyId: CompanyId) { return this.store.filter((doc) => doc.companyId === companyId.value).map(retainerMapper.toDomain); }
  async save(retainer: Retainer) { this.store.put(retainerMapper.toDoc(retainer)); }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly items: AuditLogEntry[] = [];
  async append(entry: AuditLogEntry) { this.items.push(structuredClone(entry)); }
  async byCompany(companyId: string) { return this.items.filter((item) => item.companyId === companyId).reverse(); }
}

/** Same contract as MongoFinancialLedger: checks first, then writes everything. */
export class InMemoryFinancialLedger implements FinancialLedger {
  constructor(
    private readonly invoices: InMemoryInvoiceRepository,
    private readonly payments: InMemoryPaymentRepository,
    private readonly expenses: InMemoryExpenseRepository,
    private readonly movements: InMemoryCashMovementRepository,
  ) {}

  async recordInvoicePayment(input: { invoice: Invoice; expectedPreviousRemaining: Money; payment: Payment; movement: CashMovement }) {
    if (this.payments.store.docs.has(input.payment.id.value)) throw duplicate();
    this.assertNewMovement(input.movement);
    const stored = this.invoices.store.get(input.invoice.id.value);
    if (!stored || stored.remainingMillimes !== input.expectedPreviousRemaining.amount) {
      throw new DomainError(DOMAIN_ERROR_CODES.CONCURRENT_UPDATE, "The invoice changed meanwhile, please reload and retry");
    }
    this.invoices.store.put(invoiceMapper.toDoc(input.invoice));
    this.payments.store.put(paymentMapper.toDoc(input.payment));
    this.movements.store.put(cashMovementMapper.toDoc(input.movement));
  }

  async recordExpensePayment(input: { expense: Expense; movement: CashMovement }) {
    this.assertNewMovement(input.movement);
    if (this.expenses.store.get(input.expense.id.value)?.status !== "approved") {
      throw new DomainError(DOMAIN_ERROR_CODES.CONCURRENT_UPDATE, "The expense changed meanwhile, please reload and retry");
    }
    this.expenses.store.put(expenseMapper.toDoc(input.expense));
    this.movements.store.put(cashMovementMapper.toDoc(input.movement));
  }

  async recordMovement(movement: CashMovement) {
    this.assertNewMovement(movement);
    this.movements.store.put(cashMovementMapper.toDoc(movement));
  }

  private assertNewMovement(movement: CashMovement) {
    if (this.movements.store.docs.has(movement.id.value)) throw duplicate();
  }
}

function duplicate() {
  return new DomainError(DOMAIN_ERROR_CODES.DUPLICATE_OPERATION, "This operation was already recorded");
}
