import { Company, User, Party, Invoice, Payment, Expense, CashMovement, Scenario, Retainer } from "@cashpilot/domain";
import { CompanyId, UserId, PartyId, InvoiceId, PaymentId, ExpenseId, ScenarioId, RetainerId } from "@cashpilot/domain";
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
  OAuthIdentity,
} from "@cashpilot/application";
import { Membership } from "@cashpilot/domain";

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
  async resolveOAuthIdentity(
  identity: OAuthIdentity
): Promise<User> {
  const existing = [...this.items.values()].find((user) => {
    const data = user.snapshot();

    return (
      data.oauthProvider === identity.provider &&
      data.oauthSubject === identity.subject
    );
  });

  if (existing) return existing;

  const user = User.fromOAuth({
    email: identity.email,
    name: identity.name,
    provider: identity.provider,
    subject: identity.subject,
  });

  await this.save(user);

  return user;
}
}

export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly items = new Map<string, Membership>();
  private key(userId: UserId, companyId: CompanyId) { return `${userId.value}:${companyId.value}`; }
  async byUserAndCompany(userId: UserId, companyId: CompanyId) { return this.items.get(this.key(userId, companyId)) ?? null; }
  async listByCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(membership: Membership) { this.items.set(this.key(membership.userId, membership.companyId), membership); }
  async remove(userId: UserId, companyId: CompanyId) { this.items.delete(this.key(userId, companyId)); }
  
async listByUser(userId: UserId): Promise<Membership[]> {
  return [...this.items.values()].filter(
    (membership) => membership.userId.equals(userId)
  );
}

}

export class InMemoryPartyRepository implements PartyRepository {
  private readonly items = new Map<string, Party>();
  async byId(id: PartyId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(party: Party) { this.items.set(party.id.value, party); }
}

export class InMemoryInvoiceRepository implements InvoiceRepository {
  private readonly items = new Map<string, Invoice>();
  async byId(id: InvoiceId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(invoice: Invoice) { this.items.set(invoice.id.value, invoice); }
  async nextNumber(companyId: CompanyId) { return `INV-${this.items.size + 1}`; }
}

export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly items = new Map<string, Payment>();
  async byId(id: PaymentId) { return this.items.get(id.value) ?? null; }
  async byInvoice(invoiceId: InvoiceId) { return [...this.items.values()].filter((item) => item.invoiceId.equals(invoiceId)); }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(payment: Payment) { this.items.set(payment.id.value, payment); }
}

export class InMemoryExpenseRepository implements ExpenseRepository {
  private readonly items = new Map<string, Expense>();
  async byId(id: ExpenseId) { return this.items.get(id.value) ?? null; }
  async byCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(expense: Expense) { this.items.set(expense.id.value, expense); }
}

export class InMemoryCashMovementRepository implements CashMovementRepository {
  private readonly items: CashMovement[] = [];
  async byCompany(companyId: CompanyId) { return this.items.filter((item) => item.companyId.equals(companyId)); }
  async save(movement: CashMovement) { this.items.push(movement); }
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
  private readonly items: AuditLogEntry[] = [];
  async save(entry: AuditLogEntry) { this.items.push(entry); }
  async byCompany(companyId: string) { return this.items.filter((item) => item.companyId === companyId); }
}
