import { describe, it, expect } from "vitest";
import { createWorld, createCompany } from "../test/world";

describe("audit log (BR-31)", () => {
  it("lists who did what, newest first, with the actor's name", async () => {
    const world = createWorld("2026-11-05");
    const company = await createCompany(world);
    world.clock.set("2026-11-06");
    await world.useCases.recordAdjustment.execute({ ...company.finance, amountMillimes: -1_000, movementDate: "2026-11-05", reason: "Bank fee" });
    world.clock.set("2026-11-07");
    const expense = await world.useCases.submitExpense.execute({ ...company.collaborator, category: "Software", description: "Subscription", amountMillimes: 400_000, expenseDate: "2026-11-20" });
    await world.useCases.approveExpense.execute({ ...company.owner, expenseId: expense.id });

    const log = await world.useCases.listAuditLog.execute(company.owner);
    expect(log.map((entry) => entry.action)).toEqual(["expense.approved", "cash.adjusted", "company.registered"]);
    expect(log[0]).toMatchObject({ actorId: company.owner.userId, actorName: "owner", entityType: "expense", entityId: expense.id });
    expect(log[1]).toMatchObject({ actorName: "finance", reason: "Bank fee" });
  });

  it("can keep only one kind of subject and caps the number of lines", async () => {
    const world = createWorld("2026-11-05");
    const company = await createCompany(world);
    await world.useCases.recordAdjustment.execute({ ...company.finance, amountMillimes: -1_000, movementDate: "2026-11-05", reason: "Fee" });
    expect((await world.useCases.listAuditLog.execute({ ...company.owner, entityType: "cash_movement" })).map((entry) => entry.action)).toEqual(["cash.adjusted"]);
    expect(await world.useCases.listAuditLog.execute({ ...company.owner, limit: 1 })).toHaveLength(1);
  });

  it("is reserved to owner and finance, and isolated per company", async () => {
    const world = createWorld("2026-11-05");
    const company = await createCompany(world);
    await expect(world.useCases.listAuditLog.execute(company.collaborator)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    expect(await world.useCases.listAuditLog.execute(company.finance)).not.toHaveLength(0);

    const other = await createCompany(world);
    const otherLog = await world.useCases.listAuditLog.execute(other.owner);
    expect(otherLog.every((entry) => entry.entityId === other.companyId || entry.entityType !== "company")).toBe(true);
    expect(otherLog.some((entry) => entry.entityId === company.companyId)).toBe(false);
  });

  it("the new edit use cases leave a trace", async () => {
    const world = createWorld("2026-11-05");
    const company = await createCompany(world);
    const expense = await world.useCases.submitExpense.execute({ ...company.collaborator, category: "Software", description: "Subscription", amountMillimes: 400_000, expenseDate: "2026-11-20" });
    await world.useCases.updateSubmittedExpense.execute({ ...company.collaborator, expenseId: expense.id, amountMillimes: 450_000 });
    const retainer = await world.useCases.createRetainer.execute({ ...company.finance, customerId: company.customerId, name: "Hosting", amountMillimes: 200_000, intervalDays: 30, nextGenerationDate: "2026-12-01" });
    await world.useCases.updateRetainer.execute({ ...company.finance, retainerId: retainer.id, amountMillimes: 250_000 });

    const actions = (await world.useCases.listAuditLog.execute(company.owner)).map((entry) => entry.action);
    expect(actions).toContain("expense.updated");
    expect(actions).toContain("retainer.updated");
  });
});
