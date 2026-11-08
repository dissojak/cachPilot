export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  static of(amount: number, currency = "DNT") {
    if (!Number.isInteger(amount)) throw new Error("Money amount must be an integer");
    if (amount < 0) throw new Error("Money amount cannot be negative");
    return new Money(amount, currency);
  }

  add(other: Money) {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money) {
    this.assertSameCurrency(other);
    if (other.amount > this.amount) throw new Error("Money result cannot be negative");
    return new Money(this.amount - other.amount, this.currency);
  }

  isZero() {
    return this.amount === 0;
  }

  isGreaterThan(other: Money) {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  equals(other: Money) {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money) {
    if (this.currency !== other.currency) throw new Error("Currency mismatch");
  }
}
