import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

/**
 * Money as integer millimes (1 DNT = 1000 millimes).
 * Signed: forecast balances may go below zero; use `positive` for
 * user-entered amounts that must be strictly positive (P0-1).
 */
export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  /** Any safe integer, negative allowed. For internal sums and rehydrating signed values. */
  static of(amount: number, currency = "DNT"): Money {
    if (!Number.isSafeInteger(amount)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_MONEY_AMOUNT, `Money amount must be a safe integer: ${amount}`);
    }
    return new Money(amount, currency);
  }

  /** Strictly positive: invoice lines, payments, expenses, retainers, hypotheses. */
  static positive(amount: number, currency = "DNT"): Money {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_MONEY_AMOUNT, `Money amount must be a positive integer: ${amount}`);
    }
    return new Money(amount, currency);
  }

  static zero(currency = "DNT"): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /** Never throws for a negative result: shortages are valid forecast values. */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  /** quantity must be a positive integer (invoice line quantities). */
  multiply(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, `Quantity must be a positive integer: ${quantity}`);
    }
    const product = this.amount * quantity;
    if (!Number.isSafeInteger(product)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_MONEY_AMOUNT, `Money overflow: ${this.amount} * ${quantity}`);
    }
    return new Money(product, this.currency);
  }

  negate(): Money {
    return new Money(-this.amount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(DOMAIN_ERROR_CODES.CURRENCY_MISMATCH, `Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
