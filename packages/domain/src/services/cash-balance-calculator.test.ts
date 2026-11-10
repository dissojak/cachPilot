import { describe, it, expect } from "vitest";
import { CashBalanceCalculator } from "./cash-balance-calculator";
import { CashMovement } from "../entities/cash-movement";
import { DateOnly } from "../value-objects/date-only";
import { Money } from "../value-objects/money";
import { CashMovementId, CompanyId, InvoiceId, UserId } from "../value-objects/ids";
import { Payment } from "../entities/payment";

const companyId = CompanyId.next();
const actor = UserId.next();
const referenceDate = DateOnly.from("2026-11-08");

function opening(amount: number, on: string) {
  return CashMovement.opening({
    id: CashMovementId.next(), companyId, actorId: actor,
    date: DateOnly.from(on), amount: Money.of(amount),
  });
}

function invoicePayment(amount: number, on: string) {
  const payment = Payment.create({
    companyId,
    invoiceId: InvoiceId.next(),
    amount: Money.positive(amount),
    paymentDate: DateOnly.from(on),
    method: "bank_transfer",
    recordedBy: actor,
  });
  return CashMovement.fromInvoicePayment({ id: CashMovementId.next(), payment });
}

describe("CashBalanceCalculator", () => {
  it("BR-17: sums all movements, the opening included", () => {
    const balance = new CashBalanceCalculator().balanceAt([
      opening(5000000, "2026-11-01"),
      invoicePayment(1000000, "2026-11-05"),
      CashMovement.adjustment({
        id: CashMovementId.next(), companyId, actorId: actor,
        date: DateOnly.from("2026-11-07"),
        amount: Money.of(2000000).negate(), reason: "Rent paid in advance",
      }),
    ], referenceDate);
    expect(balance.amount).toBe(4000000);
  });

  it("includes a movement made on the reference date itself", () => {
    const balance = new CashBalanceCalculator().balanceAt([
      invoicePayment(1000000, "2026-11-08"),
    ], referenceDate);
    expect(balance.amount).toBe(1000000);
  });

  it("excludes future movements", () => {
    const balance = new CashBalanceCalculator().balanceAt([
      invoicePayment(1000000, "2026-11-08"),
      invoicePayment(5000000, "2026-11-09"),
    ], referenceDate);
    expect(balance.amount).toBe(1000000);
  });

  it("is zero without movements", () => {
    expect(new CashBalanceCalculator().balanceAt([], referenceDate).isZero()).toBe(true);
  });
});
