import { describe, it, expect } from "vitest";
import { createWorld, createCompany } from "../test/world";

describe("recurring retainers (original feature)", () => {
  it("generates one validated invoice per due period, never twice", async () => {
    const world = createWorld("2026-12-15");
    const company = await createCompany(world);
    await world.useCases.createRetainer.execute({
      ...company.finance, customerId: company.customerId, name: "Monthly design", amountMillimes: 1_500_000, intervalDays: 30, nextGenerationDate: "2026-11-01",
    });
    const first = await world.useCases.generateRetainerInvoices.execute(company.finance);
    expect(first.generatedInvoiceIds).toHaveLength(2); // 1 Nov and 1 Dec
    expect((await world.useCases.generateRetainerInvoices.execute(company.finance)).generatedInvoiceIds).toHaveLength(0);
    const invoices = await world.useCases.listInvoices.execute(company.finance);
    expect(invoices.every((invoice) => invoice.status === "validated")).toBe(true);
  });

  it("a paused retainer generates nothing", async () => {
    const world = createWorld("2026-12-15");
    const company = await createCompany(world);
    const retainer = await world.useCases.createRetainer.execute({
      ...company.finance, customerId: company.customerId, name: "Hosting", amountMillimes: 200_000, intervalDays: 30, nextGenerationDate: "2026-11-01",
    });
    await world.useCases.pauseRetainer.execute({ ...company.finance, retainerId: retainer.id });
    expect((await world.useCases.generateRetainerInvoices.execute(company.finance)).generatedInvoiceIds).toHaveLength(0);
  });
});
