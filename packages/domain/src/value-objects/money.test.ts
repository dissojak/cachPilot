import { describe, it, expect } from "vitest";
import { Money } from "./money";
import { DomainError } from "../errors/domain-error";
import type { DomainErrorCode } from "../errors/codes";

function expectDomainError(fn: () => unknown, code: DomainErrorCode) {
  try {
    fn();
    expect.fail(`Expected DomainError with code ${code}`);
  } catch (error) {
    if (error instanceof DomainError) {
      expect(error.code).toBe(code);
    } else {
      expect.fail(`Expected a DomainError but got: ${String(error)}`);
    }
  }
}

describe("Money", () => {
  it("of accepts negative and zero amounts (forecast may go below zero)", () => {
    expect(Money.of(-1000000).amount).toBe(-1000000);
    expect(Money.of(0).amount).toBe(0);
    expect(Money.zero().amount).toBe(0);
  });

  it("add and subtract cross zero without throwing", () => {
    const balance = Money.of(5000000);
    const expense = Money.of(6000000);
    const result = balance.subtract(expense);
    expect(result.amount).toBe(-1000000);
    expect(result.isNegative()).toBe(true);
    expect(result.add(expense).amount).toBe(5000000);
  });

  it("of rejects non-integers", () => {
    expectDomainError(() => Money.of(1.5), "INVALID_MONEY_AMOUNT");
  });

  it("positive requires an integer greater than zero", () => {
    expect(Money.positive(1000).amount).toBe(1000);
    expectDomainError(() => Money.positive(0), "INVALID_MONEY_AMOUNT");
    expectDomainError(() => Money.positive(-1), "INVALID_MONEY_AMOUNT");
    expectDomainError(() => Money.positive(2.5), "INVALID_MONEY_AMOUNT");
  });

  it("multiply scales by a positive integer quantity", () => {
    expect(Money.positive(500).multiply(3).amount).toBe(1500);
    expectDomainError(() => Money.positive(500).multiply(0), "INVALID_INPUT");
    expectDomainError(() => Money.positive(500).multiply(-2), "INVALID_INPUT");
    expectDomainError(() => Money.positive(500).multiply(1.5), "INVALID_INPUT");
  });

  it("rejects currency mismatches", () => {
    expectDomainError(() => Money.of(100).add(Money.of(100, "EUR")), "CURRENCY_MISMATCH");
    expectDomainError(() => Money.of(100).isGreaterThan(Money.of(100, "EUR")), "CURRENCY_MISMATCH");
  });

  it("negate flips the sign", () => {
    expect(Money.of(1000).negate().amount).toBe(-1000);
    expect(Money.of(-1000).negate().isPositive()).toBe(true);
  });
});
