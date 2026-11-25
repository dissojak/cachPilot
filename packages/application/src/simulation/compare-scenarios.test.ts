import { describe, it, expect } from "vitest";
import { createWorld, createCompany, validatedInvoice } from "../test/world";

async function twoScenarios() {
  const world = createWorld("2026-11-01");
  const company = await createCompany(world, 1_000_000);
  const invoiceId = await validatedInvoice(world, company, 500_000, "2026-11-10");
  const late = await world.useCases.createScenario.execute({ ...company.owner, name: "Client pays 30 days late" });
  await world.useCases.addHypothesis.execute({ ...company.owner, scenarioId: late.id, hypothesis: { type: "client_delay", invoiceId, delayDays: 30 } });
  const purchase = await world.useCases.createScenario.execute({ ...company.owner, name: "New laptop" });
  await world.useCases.addHypothesis.execute({ ...company.owner, scenarioId: purchase.id, hypothesis: { type: "new_expense", amountMillimes: 200_000, date: "2026-11-05", label: "Laptop" } });
  return { world, company, lateId: late.id, purchaseId: purchase.id };
}

describe("compare two scenarios", () => {
  it("shows both projections and the difference (second − first) at each horizon", async () => {
    const { world, company, lateId, purchaseId } = await twoScenarios();
    const result = await world.useCases.compareScenarios.execute({ ...company.owner, baseScenarioId: lateId, simulatedScenarioId: purchaseId });

    expect(result.base.scenario.name).toBe("Client pays 30 days late");
    expect(result.simulated.scenario.name).toBe("New laptop");
    expect(result.comparison).toHaveLength(4);
    // 1 Nov: both start at 1 000 DT. +30 days: late scenario has not received the 500 DT, laptop scenario has.
    expect(result.comparison[0]).toMatchObject({ baseDate: "2026-11-01", baseMillimes: 1_000_000, simulatedMillimes: 1_000_000, deltaMillimes: 0 });
    expect(result.comparison[1]).toMatchObject({ baseDate: "2026-12-01", baseMillimes: 1_000_000, simulatedMillimes: 1_300_000, deltaMillimes: 300_000 });
    for (const row of result.comparison) expect(row.deltaMillimes).toBe(row.simulatedMillimes - row.baseMillimes);
  });

  it("saves nothing", async () => {
    const { world, company, lateId, purchaseId } = await twoScenarios();
    const movements = world.repos.movements.items.length;
    const audit = world.repos.audit.items.length;
    await world.useCases.compareScenarios.execute({ ...company.owner, baseScenarioId: lateId, simulatedScenarioId: purchaseId });
    expect(world.repos.movements.items).toHaveLength(movements);
    expect(world.repos.audit.items).toHaveLength(audit);
  });

  it("needs two different scenarios of the company, and the simulation permission", async () => {
    const { world, company, lateId, purchaseId } = await twoScenarios();
    await expect(world.useCases.compareScenarios.execute({ ...company.owner, baseScenarioId: lateId, simulatedScenarioId: lateId }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(world.useCases.compareScenarios.execute({ ...company.owner, baseScenarioId: lateId, simulatedScenarioId: "unknown" }))
      .rejects.toMatchObject({ code: "SCENARIO_NOT_FOUND" });
    await expect(world.useCases.compareScenarios.execute({ ...company.collaborator, baseScenarioId: lateId, simulatedScenarioId: purchaseId }))
      .rejects.toMatchObject({ code: "ACCESS_DENIED" });
    const other = await createCompany(world);
    await expect(world.useCases.compareScenarios.execute({ ...other.owner, baseScenarioId: lateId, simulatedScenarioId: purchaseId }))
      .rejects.toMatchObject({ code: "SCENARIO_NOT_FOUND" });
  });
});
