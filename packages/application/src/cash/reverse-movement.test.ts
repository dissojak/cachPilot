import { describe, it, expect } from "vitest";
import { createWorld, createCompany } from "../test/world";

async function setup() {
  const world = createWorld("2026-11-05");
  const company = await createCompany(world, 5_000_000);
  const adjustment = await world.useCases.recordAdjustment.execute({ ...company.finance, amountMillimes: -250_500, movementDate: "2026-11-04", reason: "Bank fee" });
  return { world, company, adjustmentId: adjustment.id };
}

describe("reverse a wrong cash movement (BR-19)", () => {
  it("adds a linked movement that cancels the adjustment and leaves the original untouched", async () => {
    const { world, company, adjustmentId } = await setup();
    const reversal = await world.useCases.reverseMovement.execute({ ...company.finance, movementId: adjustmentId, reason: "Entered twice" });

    expect(reversal).toMatchObject({ type: "reversal", amountMillimes: 250_500, reversesId: adjustmentId, reason: "Entered twice", movementDate: "2026-11-05" });
    expect((await world.useCases.getRealBalance.execute(company.finance)).balanceMillimes).toBe(5_000_000);
    const movements = await world.useCases.listCashMovements.execute(company.finance);
    expect(movements).toHaveLength(3);
    expect(movements.find((item) => item.id === adjustmentId)).toMatchObject({ type: "adjustment", amountMillimes: -250_500 });
    expect(world.repos.audit.items.at(-1)).toMatchObject({ action: "cash.reversed", entityType: "cash_movement", reason: "Entered twice" });
  });

  it("reverses a movement only once", async () => {
    const { world, company, adjustmentId } = await setup();
    const input = { ...company.owner, movementId: adjustmentId, reason: "Mistake" };
    await world.useCases.reverseMovement.execute(input);
    await expect(world.useCases.reverseMovement.execute(input)).rejects.toMatchObject({ code: "MOVEMENT_ALREADY_REVERSED" });
    expect((await world.useCases.getRealBalance.execute(company.owner)).balanceMillimes).toBe(5_000_000);
  });

  it("a double submit that skips the check is still stopped by the ledger (same derived id)", async () => {
    const { world, company, adjustmentId } = await setup();
    const input = { ...company.finance, movementId: adjustmentId, reason: "Mistake" };
    const results = await Promise.allSettled([world.useCases.reverseMovement.execute(input), world.useCases.reverseMovement.execute(input)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await world.useCases.getRealBalance.execute(company.finance)).balanceMillimes).toBe(5_000_000);
  });

  it("needs a reason, and does not reverse the opening balance, a payment or a reversal", async () => {
    const { world, company, adjustmentId } = await setup();
    await expect(world.useCases.reverseMovement.execute({ ...company.finance, movementId: adjustmentId, reason: "  " }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });

    const opening = world.repos.movements.items.find((item) => item.type === "opening")!;
    await expect(world.useCases.reverseMovement.execute({ ...company.finance, movementId: opening.id.value, reason: "Wrong" }))
      .rejects.toMatchObject({ code: "MOVEMENT_NOT_REVERSIBLE" });

    const reversal = await world.useCases.reverseMovement.execute({ ...company.finance, movementId: adjustmentId, reason: "Wrong" });
    await expect(world.useCases.reverseMovement.execute({ ...company.finance, movementId: reversal.id, reason: "Again" }))
      .rejects.toMatchObject({ code: "MOVEMENT_NOT_REVERSIBLE" });
  });

  it("a collaborator cannot reverse; another company's movement looks not found", async () => {
    const { world, company, adjustmentId } = await setup();
    await expect(world.useCases.reverseMovement.execute({ ...company.collaborator, movementId: adjustmentId, reason: "x" }))
      .rejects.toMatchObject({ code: "ACCESS_DENIED" });

    const other = await createCompany(world, 1_000_000);
    await expect(world.useCases.reverseMovement.execute({ ...other.owner, movementId: adjustmentId, reason: "x" }))
      .rejects.toMatchObject({ code: "MOVEMENT_NOT_FOUND" });
    await expect(world.useCases.reverseMovement.execute({ ...company.owner, movementId: "unknown", reason: "x" }))
      .rejects.toMatchObject({ code: "MOVEMENT_NOT_FOUND" });
  });
});
