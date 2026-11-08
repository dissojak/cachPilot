function nextId() {
  return crypto.randomUUID();
}

export class CompanyId {
  private constructor(readonly value: string) {}
  static next() { return new CompanyId(nextId()); }
  static from(value: string) { return new CompanyId(value); }
  equals(other: CompanyId) { return this.value === other.value; }
}

export class UserId {
  private constructor(readonly value: string) {}
  static next() { return new UserId(nextId()); }
  static from(value: string) { return new UserId(value); }
  equals(other: UserId) { return this.value === other.value; }
}

export class PartyId {
  private constructor(readonly value: string) {}
  static next() { return new PartyId(nextId()); }
  static from(value: string) { return new PartyId(value); }
  equals(other: PartyId) { return this.value === other.value; }
}

export class InvoiceId {
  private constructor(readonly value: string) {}
  static next() { return new InvoiceId(nextId()); }
  static from(value: string) { return new InvoiceId(value); }
  equals(other: InvoiceId) { return this.value === other.value; }
}

export class PaymentId {
  private constructor(readonly value: string) {}
  static next() { return new PaymentId(nextId()); }
  static from(value: string) { return new PaymentId(value); }
  equals(other: PaymentId) { return this.value === other.value; }
}

export class ExpenseId {
  private constructor(readonly value: string) {}
  static next() { return new ExpenseId(nextId()); }
  static from(value: string) { return new ExpenseId(value); }
  equals(other: ExpenseId) { return this.value === other.value; }
}

export class ScenarioId {
  private constructor(readonly value: string) {}
  static next() { return new ScenarioId(nextId()); }
  static from(value: string) { return new ScenarioId(value); }
  equals(other: ScenarioId) { return this.value === other.value; }
}


export class RetainerId {
  private constructor(readonly value: string) {}
  static next() { return new RetainerId(crypto.randomUUID()); }
  static from(value: string) { return new RetainerId(value); }
  equals(other: RetainerId) { return this.value === other.value; }
}
