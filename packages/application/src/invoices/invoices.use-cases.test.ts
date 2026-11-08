import { describe, it, expect } from "vitest";
import { Company, User, Membership, Party, InvoiceNumber, DateOnly, Money } from "@cashpilot/domain";
import { RecordPayment, CancelInvoice, ValidateInvoice } from "./index";
import {
  InMemoryCompanyRepository,
  InMemoryUserRepository,
  InMemoryMembershipRepository,
  InMemoryPartyRepository,
  InMemoryInvoiceRepository,
  InMemoryPaymentRepository,
  InMemoryExpenseRepository,
  InMemoryCashMovementRepository,
} from "../test/fakes";

class NoopTransactions {
  async run<T>(work: () => Promise<T>) { return work(); }
}

describe("invoice payments", () => {
  async function setup() {
    const companies = new InMemoryCompanyRepository();
    const users = new InMemoryUserRepository();
    const memberships = new InMemoryMembershipRepository();
    const parties = new InMemoryPartyRepository();
    const invoices = new InMemoryInvoiceRepository();
    const payments = new InMemoryPaymentRepository();
    const expenses = new InMemoryExpenseRepository();
    const movements = new InMemoryCashMovementRepository();

    const company = Company.create({ name: "Atlas", sector: "agency", openingBalance: Money.of(5000000) });
    await companies.save(company);
    const user = User.fromOAuth({ email: "owner@demo.test", name: "Owner", provider: "demo", subject: "owner" });
    await users.save(user);
    await memberships.save(Membership.create(user.id, company.id, "owner"));
    const party = Party.create({ companyId: company.id, type: "customer", name: "Acme" });
    await parties.save(party);

    const invoice = (await import("@cashpilot/domain")).Invoice.create({
      companyId: company.id,
      customerId: party.id,
      number: InvoiceNumber.from("INV-001"),
      issueDate: DateOnly.from("2026-11-01"),
      dueDate: DateOnly.from("2026-11-10"),
      lines: [{ description: "Work", quantity: 1, unitPrice: Money.of(3000000), lineTotal: Money.of(3000000) }],
    });
    invoice.validate();
    await invoices.save(invoice);

    return { company, user, party, invoice, companies, users, memberships, parties, invoices, payments, expenses, movements };
  }

  it("reduces remaining amount on partial payment", async () => {
    const ctx = await setup();
    await new RecordPayment(ctx.invoices, ctx.payments, ctx.movements, ctx.memberships, new NoopTransactions() as any).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      invoiceId: ctx.invoice.id.value,
      amountMillimes: 1000000,
      paymentDate: "2026-11-05",
      method: "bank",
    });

    const updated = await ctx.invoices.byId(ctx.invoice.id);
    expect(updated?.remaining.amount).toBe(2000000);
    expect(updated?.status).toBe("partially_paid");
  });

  it("rejects payment above remaining amount", async () => {
    const ctx = await setup();
    await expect(new RecordPayment(ctx.invoices, ctx.payments, ctx.movements, ctx.memberships, new NoopTransactions() as any).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      invoiceId: ctx.invoice.id.value,
      amountMillimes: 4000000,
      paymentDate: "2026-11-05",
      method: "bank",
    })).rejects.toThrow();
  });

  it("blocks cancellation after payment", async () => {
    const ctx = await setup();
    await new RecordPayment(ctx.invoices, ctx.payments, ctx.movements, ctx.memberships, new NoopTransactions() as any).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      invoiceId: ctx.invoice.id.value,
      amountMillimes: 1000000,
      paymentDate: "2026-11-05",
      method: "bank",
    });

    await expect(new CancelInvoice(ctx.invoices, ctx.payments, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      invoiceId: ctx.invoice.id.value,
    })).rejects.toThrow();
  });

  it("creates one cash movement for the payment", async () => {
    const ctx = await setup();
    await new RecordPayment(ctx.invoices, ctx.payments, ctx.movements, ctx.memberships, new NoopTransactions() as any).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      invoiceId: ctx.invoice.id.value,
      amountMillimes: 1000000,
      paymentDate: "2026-11-05",
      method: "bank",
    });

    const movements = await ctx.movements.byCompany(ctx.company.id);
    expect(movements).toHaveLength(1);
    expect(movements[0]!.amountMillimes).toBe(1000000);
  });
});
