import { describe, it, expect } from "vitest";
import { createWorld, createCompany, validatedInvoice } from "../test/world";

/** UNDERSTANDING.md §5: 5 000 DT, invoice 3 000 DT due 10 Nov, expense 6 000 DT on 15 Nov. */
async function exampleCompany() {
  const world = createWorld("2026-11-01");
  const company = await createCompany(world, 5_000_000);
  const invoiceId = await validatedInvoice(world, company, 3_000_000, "2026-11-10");
  const expense = await world.useCases.submitExpense.execute({
    ...company.owner, category: "Payroll", description: "Salaries", amountMillimes: 6_000_000, expenseDate: "2026-11-15",
  });
  await world.useCases.approveExpense.execute({ ...company.owner, expenseId: expense.id });
  return { world, company, invoiceId };
}

const at = (series: { date: string; balanceMillimes: number }[], date: string) => series.find((point) => point.date === date)?.balanceMillimes;

describe("forecast (M8)", () => {
  it("Example A: 5 000 → 8 000 on 10 Nov → 2 000 from 15 Nov, no shortage", async () => {
    const { world, company } = await exampleCompany();
    const forecast = await world.useCases.getForecast.execute(company.finance);
    expect(forecast.referenceBalanceMillimes).toBe(5_000_000);
    expect(at(forecast.series, "2026-11-10")).toBe(8_000_000);
    expect(at(forecast.series, "2026-11-15")).toBe(2_000_000);
    expect(forecast.horizons.map((point) => point.date)).toEqual(["2026-11-01", "2026-12-01", "2026-12-31", "2027-01-30"]);
    expect(forecast.shortageWindows).toEqual([]);
  });

  it("criterion 5: received money is not counted again", async () => {
    const { world, company, invoiceId } = await exampleCompany();
    await world.useCases.recordPayment.execute({ ...company.finance, invoiceId, operationId: "op-1", amountMillimes: 1_000_000, paymentDate: "2026-11-01", method: "cash" });
    const forecast = await world.useCases.getForecast.execute(company.finance);
    expect(forecast.referenceBalanceMillimes).toBe(6_000_000);
    expect(at(forecast.series, "2026-11-15")).toBe(2_000_000);
  });

  it("Example B: a 20-day delay gives a −1 000 DT shortage from 15 to 29 Nov, without touching real data", async () => {
    const { world, company, invoiceId } = await exampleCompany();
    const scenario = await world.useCases.createScenario.execute({ ...company.owner, name: "Late client" });
    await world.useCases.addHypothesis.execute({ ...company.owner, scenarioId: scenario.id, hypothesis: { type: "client_delay", invoiceId, delayDays: 20 } });
    const invoicesBefore = JSON.stringify([...world.repos.invoices.items.values()].map((i) => i.snapshot()));
    const movementsBefore = world.repos.movements.items.length;

    const result = await world.useCases.runSimulation.execute({ ...company.owner, scenarioId: scenario.id });

    expect(result.base.shortageWindows).toEqual([]);
    expect(result.simulated.shortageWindows).toEqual([{ start: "2026-11-15", end: "2026-11-29", minimumMillimes: -1_000_000, minimumDate: "2026-11-15" }]);
    expect(result.hypotheses[0]?.label).toBe("Invoice INV-0001 paid 20 days late");
    // criterion 6: a simulation never modifies real data
    expect(JSON.stringify([...world.repos.invoices.items.values()].map((i) => i.snapshot()))).toBe(invoicesBefore);
    expect(world.repos.movements.items).toHaveLength(movementsBefore);
  });

  it("dashboard alerts: overdue invoice, pending expense, negative forecast", async () => {
    const world = createWorld("2026-11-01");
    const company = await createCompany(world, 1_000_000);
    await validatedInvoice(world, company, 500_000, "2026-11-10");
    world.clock.set("2026-11-20");
    const expense = await world.useCases.submitExpense.execute({ ...company.collaborator, category: "Big", description: "Laptop", amountMillimes: 9_000_000, expenseDate: "2026-11-25" });
    expect((await world.useCases.getDashboard.execute(company.owner)).alerts.map((a) => a.type)).toEqual(["invoice_overdue", "expense_pending"]);
    await world.useCases.approveExpense.execute({ ...company.owner, expenseId: expense.id });
    const types = (await world.useCases.listAlerts.execute(company.owner)).map((a) => a.type);
    expect(types).toContain("forecast_negative");
  });

  it("a collaborator has no forecast, dashboard or simulation", async () => {
    const { world, company } = await exampleCompany();
    await expect(world.useCases.getForecast.execute(company.collaborator)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(world.useCases.getDashboard.execute(company.collaborator)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(world.useCases.createScenario.execute({ ...company.collaborator, name: "x" })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  });
});
