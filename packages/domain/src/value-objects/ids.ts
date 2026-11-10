import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

function requiredId(kind: string, value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new DomainError(DOMAIN_ERROR_CODES.INVALID_ID, `${kind} is required`);
  }
  return trimmed;
}

function nextId() {
  return crypto.randomUUID();
}

export class CompanyId {
  private constructor(readonly value: string) {}
  static next() { return new CompanyId(nextId()); }
  static from(value: string) { return new CompanyId(requiredId("Company id", value)); }
  equals(other: CompanyId) { return this.value === other.value; }
}

export class UserId {
  private constructor(readonly value: string) {}
  static next() { return new UserId(nextId()); }
  static from(value: string) { return new UserId(requiredId("User id", value)); }
  equals(other: UserId) { return this.value === other.value; }
}

export class PartyId {
  private constructor(readonly value: string) {}
  static next() { return new PartyId(nextId()); }
  static from(value: string) { return new PartyId(requiredId("Party id", value)); }
  equals(other: PartyId) { return this.value === other.value; }
}

export class InvoiceId {
  private constructor(readonly value: string) {}
  static next() { return new InvoiceId(nextId()); }
  static from(value: string) { return new InvoiceId(requiredId("Invoice id", value)); }
  equals(other: InvoiceId) { return this.value === other.value; }
}

export class PaymentId {
  private constructor(readonly value: string) {}
  static next() { return new PaymentId(nextId()); }
  static from(value: string) { return new PaymentId(requiredId("Payment id", value)); }
  equals(other: PaymentId) { return this.value === other.value; }
}

export class ExpenseId {
  private constructor(readonly value: string) {}
  static next() { return new ExpenseId(nextId()); }
  static from(value: string) { return new ExpenseId(requiredId("Expense id", value)); }
  equals(other: ExpenseId) { return this.value === other.value; }
}

export class CashMovementId {
  private constructor(readonly value: string) {}
  static next() { return new CashMovementId(nextId()); }
  static from(value: string) { return new CashMovementId(requiredId("Cash movement id", value)); }
  equals(other: CashMovementId) { return this.value === other.value; }
}

export class ScenarioId {
  private constructor(readonly value: string) {}
  static next() { return new ScenarioId(nextId()); }
  static from(value: string) { return new ScenarioId(requiredId("Scenario id", value)); }
  equals(other: ScenarioId) { return this.value === other.value; }
}

export class RetainerId {
  private constructor(readonly value: string) {}
  static next() { return new RetainerId(nextId()); }
  static from(value: string) { return new RetainerId(requiredId("Retainer id", value)); }
  equals(other: RetainerId) { return this.value === other.value; }
}
