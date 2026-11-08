import { describe, it, expect } from "vitest";
import { Company, User, Membership, Money, DateOnly } from "@cashpilot/domain";
import { SetOpeningBalance, RecordAdjustment, GetRealBalance, ListCashMovements } from "./index";
import {
  InMemoryCompanyRepository,
  InMemoryUserRepository,
  InMemoryMembershipRepository,
  InMemoryCashMovementRepository,
} from "../test/fakes";

describe("cash use cases", () => {
  async function setup() {
    const companies = new InMemoryCompanyRepository();
    const users = new InMemoryUserRepository();
    const memberships = new InMemoryMembershipRepository();
    const movements = new InMemoryCashMovementRepository();
    const company = Company.create({ name: "Atlas", sector: "agency", openingBalance: Money.of(5000000) });
    await companies.save(company);
    const user = User.fromOAuth({ email: "owner@demo.test", name: "Owner", provider: "demo", subject: "owner" });
    await users.save(user);
    await memberships.save(Membership.create(user.id, company.id, "owner"));
    return { company, user, companies, memberships, movements };
  }

  it("sets the opening balance", async () => {
    const ctx = await setup();
    const updated = await new SetOpeningBalance(ctx.companies, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      amountMillimes: 7000000,
    });
    expect(updated.openingBalanceMillimes).toBe(7000000);
  });

  it("records an adjustment movement", async () => {
    const ctx = await setup();
    const movement = await new RecordAdjustment(ctx.movements, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      amountMillimes: -500000,
      movementDate: "2026-11-05",
      reason: "Bank fee",
    });
    expect(movement.amountMillimes).toBe(-500000);
  });

  it("calculates the real balance from movements", async () => {
    const ctx = await setup();
    await new RecordAdjustment(ctx.movements, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      amountMillimes: -500000,
      movementDate: "2026-11-05",
      reason: "Bank fee",
    });
    const balance = await new GetRealBalance(ctx.companies, ctx.movements, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
    });
    expect(balance.balanceMillimes).toBe(4500000);
  });

  it("lists cash movements", async () => {
    const ctx = await setup();
    await new RecordAdjustment(ctx.movements, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      amountMillimes: 100000,
      movementDate: "2026-11-05",
      reason: "Interest",
    });
    const movements = await new ListCashMovements(ctx.movements, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
    });
    expect(movements).toHaveLength(1);
  });
});
