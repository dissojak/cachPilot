import { describe, it, expect } from "vitest";
import { createWorld } from "../test/world";

/** PROJECT.md §4 "Scénario de soutenance", end to end through the use cases. */
describe("defense scenario", () => {
  it("company → invoice → partial payment → expense → forecast → simulated delay → comparison", async () => {
    const world = createWorld("2026-11-01");
    const { useCases } = world;
    const owner = await useCases.resolveActor.execute({ email: "owner@atlas.tn", name: "Owner", provider: "google", subject: "o" });
    const finance = await useCases.resolveActor.execute({ email: "finance@atlas.tn", name: "Finance", provider: "google", subject: "f" });
    const collab = await useCases.resolveActor.execute({ email: "collab@atlas.tn", name: "Collab", provider: "google", subject: "c" });

    // 1. company with an opening balance
    const { companyId } = await useCases.registerCompany.execute({ userId: owner.userId, name: "Atlas", sector: "digital agency", openingBalanceMillimes: 5_000_000, openingDate: "2026-11-01" });
    const as = (userId: string) => ({ userId, companyId });
    await useCases.inviteMember.execute({ ...as(owner.userId), email: "finance@atlas.tn", role: "finance_manager" });
    await useCases.inviteMember.execute({ ...as(owner.userId), email: "collab@atlas.tn", role: "collaborator" });

    // 2. issue an invoice
    const customer = await useCases.createParty.execute({ ...as(finance.userId), type: "customer", name: "Acme" });
    const draft = await useCases.createInvoiceDraft.execute({ ...as(finance.userId), customerId: customer.id, issueDate: "2026-11-01", dueDate: "2026-11-10", lines: [{ description: "Website", quantity: 1, unitPriceMillimes: 3_000_000 }] });
    await useCases.validateInvoice.execute({ ...as(finance.userId), invoiceId: draft.id });

    // 3. partial payment
    const paid = await useCases.recordPayment.execute({ ...as(finance.userId), invoiceId: draft.id, operationId: "pay-1", amountMillimes: 1_000_000, paymentDate: "2026-11-01", method: "bank_transfer" });
    expect(paid.invoice.remainingMillimes).toBe(2_000_000);

    // 4. submit and approve an expense
    const expense = await useCases.submitExpense.execute({ ...as(collab.userId), category: "Payroll", description: "Salaries", amountMillimes: 6_000_000, expenseDate: "2026-11-15" });
    await useCases.approveExpense.execute({ ...as(owner.userId), expenseId: expense.id });

    // 5. forecast: 6 000 now, 8 000 on 10 Nov, 2 000 from 15 Nov
    const forecast = await useCases.getForecast.execute(as(owner.userId));
    expect(forecast.referenceBalanceMillimes).toBe(6_000_000);
    expect(forecast.series.find((p) => p.date === "2026-11-15")?.balanceMillimes).toBe(2_000_000);

    // 6. simulate a 20-day delay on the remaining 2 000 DT
    const scenario = await useCases.createScenario.execute({ ...as(owner.userId), name: "Acme pays 20 days late" });
    await useCases.addHypothesis.execute({ ...as(owner.userId), scenarioId: scenario.id, hypothesis: { type: "client_delay", invoiceId: draft.id, delayDays: 20 } });

    // 7. compare: the delay creates a 0 DT dip, then the forecast recovers on 30 Nov
    const result = await useCases.runSimulation.execute({ ...as(owner.userId), scenarioId: scenario.id });
    const simulatedOn = (date: string) => result.simulated.series.find((p) => p.date === date)?.balanceMillimes;
    expect(simulatedOn("2026-11-15")).toBe(0);
    expect(simulatedOn("2026-11-30")).toBe(2_000_000);
    expect(result.comparison[0]).toMatchObject({ baseMillimes: 6_000_000, simulatedMillimes: 6_000_000, deltaMillimes: 0 });
  });
});
