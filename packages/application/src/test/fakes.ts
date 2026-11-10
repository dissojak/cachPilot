import { DateOnly, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { Company, User, Membership, Party, Invoice, Payment, Expense, CashMovement, Scenario, Retainer, Money } from "@cashpilot/domain";
import type { CompanyId, UserId, PartyId, InvoiceId, PaymentId, ExpenseId, ScenarioId, RetainerId } from "@cashpilot/domain";
import type {
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
  FinancialLedger,
  Clock,
  IdGenerator,
  PdfExporter,
  InvoicePdfData,
} from "../ports";

export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly items = new Map<string, Company>();
  async byId(id: CompanyId) { return this.items.get(id.value) ?? null; }
  async save(company: Company) { this.items.set(company.id.value, company); }
}

export class InMemoryUserRepository implements UserRepository {
  private readonly items = new Map<string, User>();
  async byId(id: UserId) { return this.items.get(id.value) ?? null; }
  async byEmail(email: string) { return [...this.items.values()].find((user) => user.email === email) ?? null; }
  async save(user: User) { this.items.set(user.id.value, user); }
}

export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly items = new Map<string, Membership>();
  private key(userId: UserId, companyId: CompanyId) { return `${userId.value}:${companyId.value}`; }
  async byUserAndCompany(userId: UserId, companyId: CompanyId) { return this.items.get(this.key(userId, companyId)) ?? null; }
  async listByCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async listByUser(userId: UserId) { return [...this.items.values()].filter((item) => item.userId.equals(userId)); }
  async save(membership: Membership) { this.items.set(this.key(membership.userId, membership.companyId), membership); }
  async remove(userId: UserId, companyId: CompanyId) { this.items.delete(this.key(userId, companyId)); }
}

export class InMemoryPartyRepository implements PartyRepository {
  private readonly items = new Map<string, Party>();
  async byId(id: PartyId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(party: Party) { this.items.set(party.id.value, party); }
}

export class InMemoryInvoiceRepository implements InvoiceRepository {
  readonly items = new Map<string, Invoice>();
  private readonly counters = new Map<string, number>();
  async byId(id: InvoiceId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(invoice: Invoice) { this.items.set(invoice.id.value, invoice); }
  async nextNumber(companyId: CompanyId) {
    const next = (this.counters.get(companyId.value) ?? 0) + 1;
    this.counters.set(companyId.value, next);
    return `INV-${String(next).padStart(4, "0")}`;
  }
}

export class InMemoryPaymentRepository implements PaymentRepository {
  readonly items = new Map<string, Payment>();
  async byId(id: PaymentId) { return this.items.get(id.value) ?? null; }
  async byInvoice(invoiceId: InvoiceId) { return [...this.items.values()].filter((item) => item.invoiceId.equals(invoiceId)); }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
}

export class InMemoryExpenseRepository implements ExpenseRepository {
  readonly items = new Map<string, Expense>();
  async byId(id: ExpenseId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(expense: Expense) { this.items.set(expense.id.value, expense); }
}

export class InMemoryCashMovementRepository implements CashMovementRepository {
  readonly items: CashMovement[] = [];
  async byCompany(companyId: CompanyId) { return this.items.filter((item) => item.companyId.equals(companyId)); }
}

/**
 * Same contract as the Mongo ledger: duplicate ids and stale invoice amounts
 * are rejected before anything is written.
 */
export class InMemoryFinancialLedger implements FinancialLedger {
  /** Remaining amount last committed per invoice (what a database would hold). */
  private readonly committedRemaining = new Map<string, number>();

  constructor(
    private readonly invoices: InMemoryInvoiceRepository,
    private readonly payments: InMemoryPaymentRepository,
    private readonly expenses: InMemoryExpenseRepository,
    private readonly movements: InMemoryCashMovementRepository,
  ) {}

  async recordInvoicePayment(input: { invoice: Invoice; expectedPreviousRemaining: Money; payment: Payment; movement: CashMovement }) {
    if (this.payments.items.has(input.payment.id.value)) throw duplicate();
    this.assertNewMovement(input.movement);
    const committed = this.committedRemaining.get(input.invoice.id.value);
    if (committed !== undefined && committed !== input.expectedPreviousRemaining.amount) {
      throw new DomainError(DOMAIN_ERROR_CODES.CONCURRENT_UPDATE, "The invoice changed meanwhile, please retry");
    }
    this.committedRemaining.set(input.invoice.id.value, input.invoice.remaining.amount);
    this.invoices.items.set(input.invoice.id.value, input.invoice);
    this.payments.items.set(input.payment.id.value, input.payment);
    this.movements.items.push(input.movement);
  }

  async recordExpensePayment(input: { expense: Expense; movement: CashMovement }) {
    this.assertNewMovement(input.movement);
    this.expenses.items.set(input.expense.id.value, input.expense);
    this.movements.items.push(input.movement);
  }

  async recordMovement(movement: CashMovement) {
    this.assertNewMovement(movement);
    this.movements.items.push(movement);
  }

  private assertNewMovement(movement: CashMovement) {
    if (this.movements.items.some((item) => item.id.equals(movement.id))) throw duplicate();
  }
}

function duplicate() {
  return new DomainError(DOMAIN_ERROR_CODES.DUPLICATE_OPERATION, "This operation was already recorded");
}

export class InMemoryScenarioRepository implements ScenarioRepository {
  private readonly items = new Map<string, Scenario>();
  async byId(id: ScenarioId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(scenario: Scenario) { this.items.set(scenario.id.value, scenario); }
}

export class InMemoryRetainerRepository implements RetainerRepository {
  private readonly items = new Map<string, Retainer>();
  async byId(id: RetainerId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(retainer: Retainer) { this.items.set(retainer.id.value, retainer); }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  readonly items: AuditLogEntry[] = [];
  async append(entry: AuditLogEntry) { this.items.push(entry); }
  async byCompany(companyId: string) { return this.items.filter((item) => item.companyId === companyId); }
}

export class FixedClock implements Clock {
  constructor(private current: string) {}
  today() { return DateOnly.from(this.current); }
  now() { return new Date(`${this.current}T09:00:00.000Z`); }
  set(date: string) { this.current = date; }
}

export class SequentialIds implements IdGenerator {
  private next = 0;
  newId() { this.next += 1; return `id-${this.next}`; }
}

export class RecordingPdfExporter implements PdfExporter {
  readonly calls: InvoicePdfData[] = [];
  async exportInvoice(data: InvoicePdfData) { this.calls.push(data); return new Uint8Array([37, 80, 68, 70]); }
}
