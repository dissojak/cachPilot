import { describe, it, expect } from "vitest";
import { Company, User, Membership, Money, DateOnly } from "@cashpilot/domain";
import { SubmitExpense, ApproveExpense, RefuseExpense, MarkExpensePaid } from "./index";
import {
  InMemoryCompanyRepository,
  InMemoryUserRepository,
  InMemoryMembershipRepository,
  InMemoryExpenseRepository,
  InMemoryCashMovementRepository,
} from "../test/fakes";

class NoopTransactions {
  async run<T>(work: () => Promise<T>) { return work(); }
}

describe("expense use cases", () => {
  async function setup() {
    const companies = new InMemoryCompanyRepository();
    const users = new InMemoryUserRepository();
    const memberships = new InMemoryMembershipRepository();
    const expenses = new InMemoryExpenseRepository();
    const movements = new InMemoryCashMovementRepository();

    const company = Company.create({ name: "Atlas", sector: "agency", openingBalance: Money.of(5000000) });
    await companies.save(company);
    const owner = User.fromOAuth({ email: "owner@demo.test", name: "Owner", provider: "demo", subject: "owner" });
    const collaborator = User.fromOAuth({ email: "collab@demo.test", name: "Collaborator", provider: "demo", subject: "collab" });
    await users.save(owner);
    await users.save(collaborator);
    await memberships.save(Membership.create(owner.id, company.id, "owner"));
    await memberships.save(Membership.create(collaborator.id, company.id, "collaborator"));

    const expense = await new SubmitExpense(expenses, memberships).execute({
      userId: collaborator.id.value,
      companyId: company.id.value,
      category: "Software",
      description: "Subscription",
      amountMillimes: 400000,
      expenseDate: "2026-11-20",
    });

    return { company, owner, collaborator, expense, expenses, movements, memberships };
  }

  it("approves a submitted expense", async () => {
    const ctx = await setup();
    const approved = await new ApproveExpense(ctx.expenses, ctx.memberships).execute({
      actorUserId: ctx.owner.id.value,
      companyId: ctx.company.id.value,
      expenseId: ctx.expense.id,
      decisionDate: "2026-11-02",
    });
    expect(approved.status).toBe("approved");
  });

  it("refuses a submitted expense", async () => {
    const ctx = await setup();
    const refused = await new RefuseExpense(ctx.expenses, ctx.memberships).execute({
      actorUserId: ctx.owner.id.value,
      companyId: ctx.company.id.value,
      expenseId: ctx.expense.id,
      decisionDate: "2026-11-02",
      reason: "Not needed",
    });
    expect(refused.status).toBe("refused");
  });

  it("blocks payment for a refused expense", async () => {
    const ctx = await setup();
    await new RefuseExpense(ctx.expenses, ctx.memberships).execute({
      actorUserId: ctx.owner.id.value,
      companyId: ctx.company.id.value,
      expenseId: ctx.expense.id,
      decisionDate: "2026-11-02",
    });

    await expect(new MarkExpensePaid(ctx.expenses, ctx.movements, ctx.memberships, new NoopTransactions() as any).execute({
      userId: ctx.owner.id.value,
      companyId: ctx.company.id.value,
      expenseId: ctx.expense.id,
      paidDate: "2026-11-20",
    })).rejects.toThrow();
  });

  it("creates one cash movement when an approved expense is paid", async () => {
    const ctx = await setup();
    await new ApproveExpense(ctx.expenses, ctx.memberships).execute({
      actorUserId: ctx.owner.id.value,
      companyId: ctx.company.id.value,
      expenseId: ctx.expense.id,
      decisionDate: "2026-11-02",
    });

    await new MarkExpensePaid(ctx.expenses, ctx.movements, ctx.memberships, new NoopTransactions() as any).execute({
      userId: ctx.owner.id.value,
      companyId: ctx.company.id.value,
      expenseId: ctx.expense.id,
      paidDate: "2026-11-20",
    });

    const movements = await ctx.movements.byCompany(ctx.company.id);
    expect(movements).toHaveLength(1);
    expect(movements[0]!.amountMillimes).toBe(-400000);
  });
});
