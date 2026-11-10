import { describe, it, expect } from "vitest";
import { createWorld, createCompany } from "../test/world";

describe("real cash", () => {
  it("BR-17: the real balance is the opening balance plus every movement, counted once", async () => {
    const world = createWorld("2026-11-05");
    const company = await createCompany(world, 5_000_000);
    await world.useCases.recordAdjustment.execute({ ...company.finance, amountMillimes: -250_500, movementDate: "2026-11-04", reason: "Bank fee" });
    await world.useCases.recordAdjustment.execute({ ...company.owner, amountMillimes: 100_000, movementDate: "2026-11-05", reason: "Cash deposit" });
    expect((await world.useCases.getRealBalance.execute(company.owner)).balanceMillimes).toBe(4_849_500);
    expect(await world.useCases.listCashMovements.execute(company.owner)).toHaveLength(3);
  });

  it("P0-8: the opening balance is set once; corrections are adjustments", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    await expect(world.useCases.setOpeningBalance.execute({ ...company.owner, amountMillimes: 9_000_000 }))
      .rejects.toMatchObject({ code: "OPENING_BALANCE_ALREADY_SET" });
  });

  it("BR-19: an adjustment needs a reason, a non-zero amount, a past date, and is audited", async () => {
    const world = createWorld("2026-11-05");
    const company = await createCompany(world);
    const adjust = (amountMillimes: number, reason: string, movementDate = "2026-11-05") =>
      world.useCases.recordAdjustment.execute({ ...company.finance, amountMillimes, movementDate, reason });
    await expect(adjust(1_000, " ")).rejects.toThrow();
    await expect(adjust(0, "Fix")).rejects.toThrow();
    await expect(adjust(1_000, "Fix", "2026-12-01")).rejects.toMatchObject({ code: "INVALID_DATE" });
    await adjust(1_000, "Fix");
    expect(world.repos.audit.items.at(-1)).toMatchObject({ action: "cash.adjusted", reason: "Fix" });
  });

  it("a collaborator cannot see or change the cash", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    await expect(world.useCases.getRealBalance.execute(company.collaborator)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(world.useCases.recordAdjustment.execute({ ...company.collaborator, amountMillimes: 1, movementDate: "2026-11-01", reason: "x" }))
      .rejects.toMatchObject({ code: "ACCESS_DENIED" });
  });
});
