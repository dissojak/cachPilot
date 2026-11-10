import { describe, it, expect } from "vitest";
import { CashMovement } from "./cash-movement";
import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";
import { CashMovementId, CompanyId, InvoiceId, UserId } from "../value-objects/ids";
import { Payment } from "./payment";
import { Expense } from "./expense";
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

const companyId = CompanyId.next();
const actor = UserId.next();
const date = DateOnly.from("2026-11-10");

function createPayment(amount = 1000000) {
  return Payment.create({
    companyId,
    invoiceId: InvoiceId.next(),
    amount: Money.positive(amount),
    paymentDate: date,
    method: "bank_transfer",
    recordedBy: actor,
  });
}

function createPaidExpense(amount = 2000000) {
  const expense = Expense.create({
    companyId,
    submittedBy: actor,
    category: "Rent",
    description: "Office rent",
    amount: Money.positive(amount),
    expenseDate: DateOnly.from("2026-11-05"),
  });
  expense.approve(actor, DateOnly.from("2026-11-06"));
  expense.markPaid(actor, date);
  return expense;
}

describe("CashMovement.intent factories", () => {
  it("opens a company with a non-negative movement", () => {
    const movement = CashMovement.opening({
      id: CashMovementId.next(),
      companyId,
      actorId: actor,
      date,
      amount: Money.of(5000000),
    });
    expect(movement.type).toBe("opening");
    expect(movement.amount.amount).toBe(5000000);
    expect(movement.movementDate).toBe(date);
  });

  it("rejects a negative opening balance", () => {
    expectDomainError(() => CashMovement.opening({
      id: CashMovementId.next(),
      companyId,
      actorId: actor,
      date,
      amount: Money.of(-1),
    }), "INVALID_INPUT");
  });

  it("builds an invoice payment movement from the payment (+amount)", () => {
    const payment = createPayment();
    const movement = CashMovement.fromInvoicePayment({ id: CashMovementId.next(), payment });
    expect(movement.companyId).toBe(companyId);
    expect(movement.type).toBe("invoice_payment");
    expect(movement.amount.amount).toBe(1000000);
    expect(movement.movementDate).toBe(date);
    expect(movement.snapshot().sourceId).toBe(payment.id.value);
  });

  it("builds an expense payment movement from a paid expense (−amount)", () => {
    const expense = createPaidExpense();
    const movement = CashMovement.fromExpensePayment({ id: CashMovementId.next(), expense });
    expect(movement.type).toBe("expense_payment");
    expect(movement.amount.isNegative()).toBe(true);
    expect(movement.amount.amount).toBe(-2000000);
    expect(movement.movementDate).toBe(date);
    expect(movement.snapshot().sourceId).toBe(expense.id.value);
  });

  it("rejects an expense movement for an expense that is not paid", () => {
    const submitted = Expense.create({
      companyId,
      submittedBy: actor,
      category: "Meals",
      description: "Team lunch",
      amount: Money.positive(120000),
      expenseDate: DateOnly.from("2026-11-05"),
    });
    expectDomainError(() => CashMovement.fromExpensePayment({ id: CashMovementId.next(), expense: submitted }), "INVALID_TRANSITION");
  });

  it("requires a non-zero amount and a reason for an adjustment", () => {
    expectDomainError(() => CashMovement.adjustment({
      id: CashMovementId.next(), companyId, actorId: actor, date,
      amount: Money.zero(), reason: "Bank fee",
    }), "INVALID_INPUT");
    expectDomainError(() => CashMovement.adjustment({
      id: CashMovementId.next(), companyId, actorId: actor, date,
      amount: Money.of(100).negate(),
      reason: "  ",
    }), "INVALID_INPUT");
    const movement = CashMovement.adjustment({
      id: CashMovementId.next(), companyId, actorId: actor, date,
      amount: Money.of(100).negate(), reason: "Bank fee",
    });
    expect(movement.type).toBe("adjustment");
    expect(movement.amount.amount).toBe(-100);
  });

  it("reverses an existing movement with the negated amount and a reason", () => {
    const original = CashMovement.adjustment({
      id: CashMovementId.next(), companyId, actorId: actor,
      date: DateOnly.from("2026-11-05"),
      amount: Money.of(300000), reason: "Bank fee",
    });
    const reversal = CashMovement.reversal({
      id: CashMovementId.next(),
      original,
      actorId: actor,
      date: DateOnly.from("2026-11-08"),
      reason: "Wrong correction",
    });
    expect(reversal.type).toBe("reversal");
    expect(reversal.amount.amount).toBe(-300000);
    expect(reversal.reversesId?.equals(original.id)).toBe(true);
  });

  it("requires a reason for a reversal", () => {
    const original = CashMovement.adjustment({
      id: CashMovementId.next(), companyId, actorId: actor,
      date: DateOnly.from("2026-11-05"),
      amount: Money.of(300000), reason: "Bank fee",
    });
    expectDomainError(() => CashMovement.reversal({
      id: CashMovementId.next(), original, actorId: actor,
      date: DateOnly.from("2026-11-08"), reason: "",
    }), "INVALID_INPUT");
  });

  it("snapshots every field as primitives", () => {
    const movement = CashMovement.fromInvoicePayment({ id: CashMovementId.next(), payment: createPayment() });
    const snapshot = movement.snapshot();
    expect(snapshot).toMatchObject({
      companyId: companyId.value,
      type: "invoice_payment",
      amountMillimes: 1000000,
      movementDate: "2026-11-10",
      sourceType: "payment",
      actorId: actor.value,
    });
  });
});
