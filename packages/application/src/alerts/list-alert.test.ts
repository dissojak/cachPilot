import { describe, it, expect } from "vitest";
import { createWorld, createCompany, validatedInvoice } from "../test/world";

describe("alerts page", () => {
  it("lists every alert, or only one type", async () => {
    const world = createWorld("2026-11-01");
    const company = await createCompany(world, 1_000_000);
    await validatedInvoice(world, company, 500_000, "2026-11-10");
    world.clock.set("2026-11-20");
    const expense = await world.useCases.submitExpense.execute({ ...company.collaborator, category: "Big", description: "Laptop", amountMillimes: 9_000_000, expenseDate: "2026-11-25" });
    await world.useCases.approveExpense.execute({ ...company.owner, expenseId: expense.id });

    const all = await world.useCases.listAlerts.execute(company.owner);
    expect(all.map((alert) => alert.type)).toEqual(["invoice_overdue", "forecast_negative"]);
    expect((await world.useCases.listAlerts.execute({ ...company.owner, type: "invoice_overdue" })).map((alert) => alert.type)).toEqual(["invoice_overdue"]);
    expect(await world.useCases.listAlerts.execute({ ...company.owner, type: "expense_pending" })).toEqual([]);
  });

  it("a collaborator has no alerts page", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    await expect(world.useCases.listAlerts.execute(company.collaborator)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  });
});
