import { describe, it, expect } from "vitest";
import { Invoice } from "./invoice";
import type { InvoiceLineInput } from "./invoice";
import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";
import { CompanyId, PartyId, UserId } from "../value-objects/ids";
import { InvoiceNumber } from "../value-objects/invoice-number";
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
const customerId = PartyId.next();
const actor = UserId.next();
const issueDate = DateOnly.from("2026-11-01");
const dueDate = DateOnly.from("2026-11-10");

function oneLine(): InvoiceLineInput[] {
  return [{ description: "Design sprint", quantity: 1, unitPrice: Money.positive(3000000) }];
}

function createInvoice() {
  return Invoice.create({
    companyId,
    customerId,
    number: InvoiceNumber.from("INV-0001"),
    issueDate,
    dueDate,
    lines: oneLine(),
  });
}

describe("Invoice.create invariants", () => {
  it("computes the line total from unit price x quantity (entity, not caller)", () => {
    const invoice = Invoice.create({
      companyId,
      customerId,
      number: InvoiceNumber.from("INV-0001"),
      issueDate,
      dueDate,
      lines: [{ description: "Licenses", quantity: 3, unitPrice: Money.positive(1000000) }],
    });
    expect(invoice.total.amount).toBe(3000000);
    expect(invoice.lines[0]?.lineTotal.amount).toBe(3000000);
    expect(invoice.remaining.amount).toBe(3000000);
    expect(invoice.status).toBe("draft");
  });

  it("rejects an invoice with no lines", () => {
    expectDomainError(() => Invoice.create({
      companyId,
      customerId,
      number: InvoiceNumber.from("INV-0001"),
      issueDate,
      dueDate,
      lines: [],
    }), "INVALID_INPUT");
  });

  it("rejects an empty description", () => {
    expectDomainError(() => Invoice.create({
      companyId,
      customerId,
      number: InvoiceNumber.from("INV-0001"),
      issueDate,
      dueDate,
      lines: [{ description: "   ", quantity: 1, unitPrice: Money.positive(1000) }],
    }), "INVALID_INPUT");
  });

  it("rejects a zero or negative quantity and a non-positive unit price", () => {
    expectDomainError(() => Invoice.create({
      companyId, customerId, number: InvoiceNumber.from("INV-0001"), issueDate, dueDate,
      lines: [{ description: "x", quantity: 0, unitPrice: Money.positive(1000) }],
    }), "INVALID_INPUT");
    expectDomainError(() => Invoice.create({
      companyId, customerId, number: InvoiceNumber.from("INV-0001"), issueDate, dueDate,
      lines: [{ description: "x", quantity: 1, unitPrice: Money.zero() }],
    }), "INVALID_INPUT");
  });

  it("rejects a due date before the issue date", () => {
    expectDomainError(() => Invoice.create({
      companyId,
      customerId,
      number: InvoiceNumber.from("INV-0001"),
      issueDate,
      dueDate: DateOnly.from("2026-10-31"),
      lines: oneLine(),
    }), "INVALID_INPUT");
  });
});

describe("BR-04 lifecycle transitions", () => {
  it("draft → validated (allowed)", () => {
    const invoice = createInvoice();
    invoice.validate();
    expect(invoice.status).toBe("validated");
  });

  it("draft → cancelled (allowed, reason recorded)", () => {
    const invoice = createInvoice();
    invoice.cancel({ hasPayments: false, by: actor, on: DateOnly.from("2026-11-05"), reason: "Client asked for a quote instead" });
    expect(invoice.status).toBe("cancelled");
    expect(invoice.snapshot().cancelledReason).toBe("Client asked for a quote instead");
    expect(invoice.snapshot().cancelledBy).toBe(actor.value);
    expect(invoice.snapshot().cancelledAt).toBe("2026-11-05");
  });

  it("validated → partially_paid → paid (through payments)", () => {
    const invoice = createInvoice();
    invoice.validate();
    invoice.applyPayment(Money.positive(1000000));
    expect(invoice.status).toBe("partially_paid");
    invoice.applyPayment(Money.positive(2000000));
    expect(invoice.status).toBe("paid");
    expect(invoice.remaining.isZero()).toBe(true);
  });

  it("validated → paid (full payment)", () => {
    const invoice = createInvoice();
    invoice.validate();
    invoice.applyPayment(Money.positive(3000000));
    expect(invoice.status).toBe("paid");
  });

  it("paid and cancelled invoices refuse payments", () => {
    const paid = createInvoice();
    paid.validate();
    paid.applyPayment(Money.positive(3000000));
    expectDomainError(() => paid.applyPayment(Money.positive(1)), "INVOICE_ALREADY_PAID");

    const cancelled = createInvoice();
    cancelled.cancel({ hasPayments: false, by: actor, on: DateOnly.from("2026-11-05"), reason: "no" });
    expectDomainError(() => cancelled.applyPayment(Money.positive(1)), "INVOICE_NOT_PAYABLE");
  });

  it("paid invoices refuse cancellation and validated invoices refuse re-validation", () => {
    const invoice = createInvoice();
    invoice.validate();
    invoice.applyPayment(Money.positive(3000000));
    expectDomainError(() => invoice.cancel({ hasPayments: true, by: actor, on: DateOnly.from("2026-11-05"), reason: "late" }), "INVOICE_HAS_PAYMENTS");
    expectDomainError(() => invoice.validate(), "INVALID_TRANSITION");
  });
});

describe("BR-06/BR-07/BR-09/BR-11/BR-12 payments and cancellation", () => {
  it("blocks cancellation with recorded payments (INVOICE_HAS_PAYMENTS)", () => {
    const invoice = createInvoice();
    invoice.validate();
    expectDomainError(() => invoice.cancel({ hasPayments: true, by: actor, on: DateOnly.from("2026-11-05"), reason: "oops" }), "INVOICE_HAS_PAYMENTS");
  });

  it("requires a non-empty cancellation reason (INVALID_INPUT)", () => {
    const invoice = createInvoice();
    expectDomainError(() => invoice.cancel({ hasPayments: false, by: actor, on: DateOnly.from("2026-11-05"), reason: "  " }), "INVALID_INPUT");
  });

  it("a partially paid invoice can no longer be cancelled (it has payments)", () => {
    const invoice = createInvoice();
    invoice.validate();
    invoice.applyPayment(Money.positive(1000000));
    expectDomainError(() => invoice.cancel({ hasPayments: true, by: actor, on: DateOnly.from("2026-11-05"), reason: "x" }), "INVOICE_HAS_PAYMENTS");
  });

  it("rejects a draft invoice payment (BR-12)", () => {
    const invoice = createInvoice();
    expectDomainError(() => invoice.applyPayment(Money.positive(1000)), "INVOICE_NOT_PAYABLE");
  });

  it("rejects a zero or negative payment (BR-07)", () => {
    const invoice = createInvoice();
    invoice.validate();
    expectDomainError(() => invoice.applyPayment(Money.zero()), "INVALID_MONEY_AMOUNT");
    expectDomainError(() => invoice.applyPayment(Money.of(-1000)), "INVALID_MONEY_AMOUNT");
  });
});

describe("spec validation criteria 1 and 2", () => {
  it("a partial payment reduces the remaining amount exactly", () => {
    const invoice = createInvoice();
    invoice.validate();
    invoice.applyPayment(Money.positive(1000000));
    expect(invoice.remaining.amount).toBe(2000000);
  });

  it("a payment above the remaining amount is rejected and changes nothing", () => {
    const invoice = createInvoice();
    invoice.validate();
    expectDomainError(() => invoice.applyPayment(Money.positive(4000000)), "PAYMENT_EXCEEDS_REMAINING");
    expect(invoice.remaining.amount).toBe(3000000);
    expect(invoice.status).toBe("validated");
  });
});

describe("isOverdue (BR-05)", () => {
  it("is overdue when validated, past due and unpaid", () => {
    const invoice = createInvoice(); // due 2026-11-10
    invoice.validate();
    expect(invoice.isOverdue(DateOnly.from("2026-11-15"))).toBe(true);
    expect(invoice.isOverdue(DateOnly.from("2026-11-10"))).toBe(false);
  });

  it("is not overdue when paid, cancelled, draft or due in the future", () => {
    const draft = createInvoice();
    expect(draft.isOverdue(DateOnly.from("2026-11-15"))).toBe(false);

    const paid = createInvoice();
    paid.validate();
    paid.applyPayment(Money.positive(3000000));
    expect(paid.isOverdue(DateOnly.from("2026-11-15"))).toBe(false);

    const future = Invoice.create({
      companyId,
      customerId,
      number: InvoiceNumber.from("INV-0002"),
      issueDate,
      dueDate: DateOnly.from("2026-12-10"),
      lines: oneLine(),
    });
    future.validate();
    expect(future.isOverdue(DateOnly.from("2026-11-15"))).toBe(false);
  });

  it("a partially paid past-due invoice is still overdue (money is still owed)", () => {
    const invoice = createInvoice();
    invoice.validate();
    invoice.applyPayment(Money.positive(1000000));
    expect(invoice.isOverdue(DateOnly.from("2026-11-15"))).toBe(true);
  });
});

describe("expectedReceipt (forecast input)", () => {
  it("returns the remaining amount at the due date for validated invoices", () => {
    const invoice = createInvoice();
    invoice.validate();
    expect(invoice.expectedReceipt()).toEqual({
      invoiceId: invoice.id.value,
      dueDate,
      amount: Money.of(3000000),
    });
  });

  it("returns the remaining amount for partially paid invoices", () => {
    const invoice = createInvoice();
    invoice.validate();
    invoice.applyPayment(Money.positive(1000000));
    expect(invoice.expectedReceipt()?.amount.amount).toBe(2000000);
  });

  it("returns null for draft, paid and cancelled invoices", () => {
    expect(createInvoice().expectedReceipt()).toBeNull();

    const paid = createInvoice();
    paid.validate();
    paid.applyPayment(Money.positive(3000000));
    expect(paid.expectedReceipt()).toBeNull();

    const cancelled = createInvoice();
    cancelled.cancel({ hasPayments: false, by: actor, on: DateOnly.from("2026-11-05"), reason: "x" });
    expect(cancelled.expectedReceipt()).toBeNull();
  });
});
