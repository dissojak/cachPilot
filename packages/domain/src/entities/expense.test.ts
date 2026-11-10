import { describe, it, expect } from "vitest";
import { Expense } from "./expense";
import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";
import { CompanyId, UserId } from "../value-objects/ids";
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
const submitter = UserId.next();
const owner = UserId.next();
const finance = UserId.next();

function createExpense() {
  return Expense.create({
    companyId,
    submittedBy: submitter,
    category: "Travel",
    description: "Client visit in Sfax",
    amount: Money.positive(250000),
    expenseDate: DateOnly.from("2026-11-15"),
  });
}

describe("Expense.create invariants", () => {
  it("starts submitted with a trimmed category and description", () => {
    const expense = createExpense();
    expect(expense.status).toBe("submitted");
    expect(expense.amount.amount).toBe(250000);
  });

  it("rejects an empty category or description", () => {
    expectDomainError(() => Expense.create({
      companyId, submittedBy: submitter, category: "  ", description: "x",
      amount: Money.positive(1000), expenseDate: DateOnly.from("2026-11-15"),
    }), "INVALID_INPUT");
    expectDomainError(() => Expense.create({
      companyId, submittedBy: submitter, category: "Travel", description: "",
      amount: Money.positive(1000), expenseDate: DateOnly.from("2026-11-15"),
    }), "INVALID_INPUT");
  });

  it("rejects a non-positive amount", () => {
    expectDomainError(() => Expense.create({
      companyId, submittedBy: submitter, category: "Travel", description: "x",
      amount: Money.zero(), expenseDate: DateOnly.from("2026-11-15"),
    }), "INVALID_INPUT");
  });
});

describe("BR-13 lifecycle transitions", () => {
  it("submitted → approved → paid (allowed)", () => {
    const expense = createExpense();
    expense.approve(owner, DateOnly.from("2026-11-16"));
    expect(expense.status).toBe("approved");
    expense.markPaid(finance, DateOnly.from("2026-11-20"));
    expect(expense.status).toBe("paid");
  });

  it("submitted → refused (allowed, reason recorded)", () => {
    const expense = createExpense();
    expense.refuse(owner, DateOnly.from("2026-11-16"), "No receipt provided");
    expect(expense.status).toBe("refused");
    expect(expense.snapshot().approval?.reason).toBe("No receipt provided");
  });

  it("approved and refused expenses refuse approval or refusal again", () => {
    const approved = createExpense();
    approved.approve(owner, DateOnly.from("2026-11-16"));
    expectDomainError(() => approved.approve(owner, DateOnly.from("2026-11-17")), "INVALID_TRANSITION");
    expectDomainError(() => approved.refuse(owner, DateOnly.from("2026-11-17"), "x"), "INVALID_TRANSITION");

    const refused = createExpense();
    refused.refuse(owner, DateOnly.from("2026-11-16"), "no");
    expectDomainError(() => refused.approve(owner, DateOnly.from("2026-11-17")), "INVALID_TRANSITION");
  });
});

describe("revise (edit before decision)", () => {
  it("the submitter can revise a submitted expense", () => {
    const expense = createExpense();
    expense.revise(submitter, false, { description: "Client visit in Sousse", amount: Money.positive(300000) });
    expect(expense.snapshot().description).toBe("Client visit in Sousse");
    expect(expense.amount.amount).toBe(300000);
  });

  it("a finance role can revise someone else's expense", () => {
    const expense = createExpense();
    expense.revise(finance, true, { category: "Software" });
    expect(expense.snapshot().category).toBe("Software");
  });

  it("a non-submitter without the pay permission gets ACCESS_DENIED", () => {
    const expense = createExpense();
    expectDomainError(() => expense.revise(finance, false, { description: "hacked" }), "ACCESS_DENIED");
  });

  it("an approved expense can no longer be revised", () => {
    const expense = createExpense();
    expense.approve(owner, DateOnly.from("2026-11-16"));
    expectDomainError(() => expense.revise(submitter, false, { description: "late edit" }), "INVALID_TRANSITION");
  });
});

describe("attachReceipt", () => {
  it("attaches to a submitted expense", () => {
    const expense = createExpense();
    expense.attachReceipt("receipt-file-1");
    expect(expense.snapshot().receiptFileId).toBe("receipt-file-1");
  });

  it("attaches to an approved expense but not to a refused or paid one", () => {
    const refused = createExpense();
    refused.refuse(owner, DateOnly.from("2026-11-16"), "no");
    expectDomainError(() => refused.attachReceipt("receipt-file-2"), "INVALID_TRANSITION");
  });

  it("requires a non-empty file id", () => {
    const expense = createExpense();
    expectDomainError(() => expense.attachReceipt("  "), "INVALID_INPUT");
  });
});

describe("refuse (BR-14) and markPaid (BR-15/BR-16)", () => {
  it("refusal requires a non-empty reason", () => {
    const expense = createExpense();
    expectDomainError(() => expense.refuse(owner, DateOnly.from("2026-11-16"), "  "), "INVALID_INPUT");
  });

  it("spec criterion 3: a refused expense can never be marked paid", () => {
    const expense = createExpense();
    expense.refuse(owner, DateOnly.from("2026-11-16"), "No receipt provided");
    expectDomainError(() => expense.markPaid(finance, DateOnly.from("2026-11-20")), "REFUSED_EXPENSE_CANNOT_BE_PAID");
  });

  it("a submitted (not approved) expense is not payable", () => {
    const expense = createExpense();
    expectDomainError(() => expense.markPaid(finance, DateOnly.from("2026-11-20")), "EXPENSE_NOT_APPROVED");
  });

  it("an expense is paid exactly once", () => {
    const expense = createExpense();
    expense.approve(owner, DateOnly.from("2026-11-16"));
    expense.markPaid(finance, DateOnly.from("2026-11-20"));
    expectDomainError(() => expense.markPaid(finance, DateOnly.from("2026-11-21")), "EXPENSE_ALREADY_PAID");
  });
});

describe("plannedDisbursement (forecast input)", () => {
  it("returns the amount at the planned date for approved expenses", () => {
    const expense = createExpense();
    expense.approve(owner, DateOnly.from("2026-11-16"));
    expect(expense.plannedDisbursement()).toEqual({
      expenseId: expense.id.value,
      date: DateOnly.from("2026-11-15"),
      amount: Money.of(250000),
    });
  });

  it("returns null for submitted, refused and paid expenses", () => {
    expect(createExpense().plannedDisbursement()).toBeNull();

    const refused = createExpense();
    refused.refuse(owner, DateOnly.from("2026-11-16"), "no");
    expect(refused.plannedDisbursement()).toBeNull();

    const paid = createExpense();
    paid.approve(owner, DateOnly.from("2026-11-16"));
    paid.markPaid(finance, DateOnly.from("2026-11-20"));
    expect(paid.plannedDisbursement()).toBeNull();
  });
});
