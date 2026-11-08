
import { describe, it, expect } from "vitest";
import { Invoice } from "./invoice";
import { Money } from "../value-objects/money";
import {
  CompanyId,
  PartyId,
  InvoiceId,
} from "../value-objects/ids";
import { InvoiceNumber } from "../value-objects/invoice-number";
import { DateOnly } from "../value-objects/date-only";

function createInvoice() {
  return Invoice.create({
    id: InvoiceId.from("invoice-test-1"),
    companyId: CompanyId.from("company-test-1"),
    customerId: PartyId.from("customer-test-1"),
    number: InvoiceNumber.from("FAC-001"),
    issueDate: DateOnly.from("2026-11-01"),
    dueDate: DateOnly.from("2026-11-30"),
    lines: [
      {
        description: "Développement site web",
        quantity: 1,
        unitPrice: Money.of(3000000),
        lineTotal: Money.of(3000000),
      },
    ],
  });
}

describe("Invoice", () => {
  it("crée une facture en brouillon", () => {
    const invoice = createInvoice();

    expect(invoice.status).toBe("draft");
    expect(invoice.remaining.amount).toBe(3000000);
  });

  it("valide une facture", () => {
    const invoice = createInvoice();

    invoice.validate();

    expect(invoice.status).toBe("validated");
  });

  it("enregistre un paiement partiel", () => {
    const invoice = createInvoice();

    invoice.validate();
    invoice.applyPayment(Money.of(1000000));

    expect(invoice.remaining.amount).toBe(2000000);
    expect(invoice.status).toBe("partially_paid");
  });

  it("refuse un paiement supérieur au reste", () => {
    const invoice = createInvoice();

    invoice.validate();

    expect(() =>
      invoice.applyPayment(Money.of(4000000))
    ).toThrow("Payment exceeds remaining amount");

    expect(invoice.remaining.amount).toBe(3000000);
  });

  it("marque la facture payée entièrement", () => {
    const invoice = createInvoice();

    invoice.validate();
    invoice.applyPayment(Money.of(3000000));

    expect(invoice.remaining.amount).toBe(0);
    expect(invoice.status).toBe("paid");
  });

  it("interdit un paiement sur un brouillon", () => {
    const invoice = createInvoice();

    expect(() =>
      invoice.applyPayment(Money.of(1000000))
    ).toThrow("Invoice is not payable");
  });

  it("interdit l'annulation après paiement", () => {
    const invoice = createInvoice();

    invoice.validate();
    invoice.applyPayment(Money.of(1000000));

    expect(() => invoice.cancel(true)).toThrow(
      "Invoice with payments cannot be cancelled"
    );
  });
});
