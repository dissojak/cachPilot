import { describe, it, expect } from "vitest";
import { createWorld, createCompany, validatedInvoice } from "../test/world";

async function setup() {
  const world = createWorld("2026-11-05");
  const company = await createCompany(world);
  const invoiceId = await validatedInvoice(world, company, 3_000_000, "2026-11-10");
  const pay = (amountMillimes: number, operationId: string, actor = company.finance) =>
    world.useCases.recordPayment.execute({ ...actor, invoiceId, operationId, amountMillimes, paymentDate: "2026-11-05", method: "bank_transfer" });
  return { world, company, invoiceId, pay };
}

describe("invoices and payments", () => {
  it("numbers invoices per company without gaps (D6)", async () => {
    const { world, company } = await setup();
    const second = await validatedInvoice(world, company, 1_000, "2026-11-20");
    expect((await world.useCases.getInvoice.execute({ ...company.finance, invoiceId: second })).number).toBe("INV-0002");
  });

  it("criterion 1: a partial payment reduces the remaining amount", async () => {
    const { pay } = await setup();
    const result = await pay(1_000_000, "op-1");
    expect(result.invoice.remainingMillimes).toBe(2_000_000);
    expect(result.invoice.status).toBe("partially_paid");
  });

  it("criterion 2: a payment above the remaining amount is rejected and nothing is stored", async () => {
    const { world, pay } = await setup();
    await expect(pay(3_000_001, "op-1")).rejects.toMatchObject({ code: "PAYMENT_EXCEEDS_REMAINING" });
    expect(world.repos.payments.items.size).toBe(0);
    expect(world.repos.movements.items).toHaveLength(1); // only the opening balance
  });

  it("criterion 4 / BR-10: one payment creates exactly one cash movement", async () => {
    const { world, company, pay } = await setup();
    await pay(1_000_000, "op-1");
    const balance = await world.useCases.getRealBalance.execute(company.finance);
    expect(balance.balanceMillimes).toBe(6_000_000);
  });

  it("D5: submitting the same payment twice is rejected", async () => {
    const { world, company, pay } = await setup();
    await pay(1_000_000, "op-1");
    await expect(pay(1_000_000, "op-1")).rejects.toMatchObject({ code: "DUPLICATE_OPERATION" });
    expect((await world.useCases.getRealBalance.execute(company.finance)).balanceMillimes).toBe(6_000_000);
  });

  it("criterion 9: two payments of 1 000.333 DT on 3 000 DT leave exactly 999.334 DT, no rounding", async () => {
    const { pay } = await setup();
    await pay(1_000_333, "op-1");
    const last = await pay(1_000_333, "op-2");
    expect(last.invoice.remainingMillimes).toBe(999_334);
  });

  it("refuses a payment dated in the future", async () => {
    const { world, company, invoiceId } = await setup();
    await expect(world.useCases.recordPayment.execute({
      ...company.finance, invoiceId, operationId: "op-1", amountMillimes: 1_000, paymentDate: "2026-12-01", method: "cash",
    })).rejects.toMatchObject({ code: "INVALID_DATE" });
  });

  it("BR-06: an invoice with payments cannot be cancelled", async () => {
    const { world, company, invoiceId, pay } = await setup();
    await pay(1_000_000, "op-1");
    await expect(world.useCases.cancelInvoice.execute({ ...company.finance, invoiceId, reason: "error" }))
      .rejects.toMatchObject({ code: "INVOICE_HAS_PAYMENTS" });
  });

  it("refuses a customer that belongs to another company (BR-01)", async () => {
    const { world, company } = await setup();
    const other = await createCompany(world);
    await expect(world.useCases.createInvoiceDraft.execute({
      ...company.finance, customerId: other.customerId, issueDate: "2026-11-05", dueDate: "2026-11-10",
      lines: [{ description: "x", quantity: 1, unitPriceMillimes: 1_000 }],
    })).rejects.toMatchObject({ code: "PARTY_NOT_FOUND" });
  });

  it("BR-02: a collaborator cannot record payments or create invoices", async () => {
    const { world, company, pay } = await setup();
    await expect(pay(1_000, "op-1", company.collaborator)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(world.useCases.createInvoiceDraft.execute({
      ...company.collaborator, customerId: company.customerId, issueDate: "2026-11-05", dueDate: "2026-11-10",
      lines: [{ description: "x", quantity: 1, unitPriceMillimes: 1_000 }],
    })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    expect(world.repos.payments.items.size).toBe(0);
  });

  it("criterion 7: a member of another company cannot read this invoice", async () => {
    const { world, company, invoiceId } = await setup();
    const other = await createCompany(world);
    await expect(world.useCases.getInvoice.execute({ userId: other.owner.userId, companyId: company.companyId, invoiceId }))
      .rejects.toMatchObject({ code: "ACCESS_DENIED" });
  });

  it("validating and paying leave an audit trail", async () => {
    const { world, pay } = await setup();
    await pay(1_000, "op-1");
    expect(world.repos.audit.items.map((entry) => entry.action)).toEqual(["company.registered", "invoice.validated", "payment.recorded"]);
  });

  it("exports a PDF from the invoice data", async () => {
    const { world, company, invoiceId } = await setup();
    const result = await world.useCases.exportInvoicePdf.execute({ ...company.owner, invoiceId });
    expect(result.fileName).toBe("INV-0001.pdf");
    expect(world.pdf.calls[0]?.customer.name).toBe("Acme");
  });
});
