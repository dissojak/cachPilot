import { describe, it, expect } from "vitest";
import { createWorld, createCompany } from "../test/world";

async function setup() {
  const world = createWorld("2026-11-05");
  const company = await createCompany(world);
  const expense = await world.useCases.submitExpense.execute({
    ...company.collaborator, category: "Software", description: "Subscription", amountMillimes: 400_000, expenseDate: "2026-11-20",
  });
  return { world, company, expenseId: expense.id };
}

describe("expense approval workflow", () => {
  it("submit → approve (owner) → pay (finance) creates one negative cash movement", async () => {
    const { world, company, expenseId } = await setup();
    await world.useCases.approveExpense.execute({ ...company.owner, expenseId });
    await world.useCases.markExpensePaid.execute({ ...company.finance, expenseId, paidDate: "2026-11-05" });
    const balance = await world.useCases.getRealBalance.execute(company.finance);
    expect(balance.balanceMillimes).toBe(5_000_000 - 400_000);
    await expect(world.useCases.markExpensePaid.execute({ ...company.finance, expenseId, paidDate: "2026-11-05" }))
      .rejects.toMatchObject({ code: "EXPENSE_ALREADY_PAID" });
  });

  it("criterion 3: a refused expense can never be paid", async () => {
    const { world, company, expenseId } = await setup();
    await world.useCases.refuseExpense.execute({ ...company.owner, expenseId, reason: "Not needed" });
    await expect(world.useCases.markExpensePaid.execute({ ...company.finance, expenseId, paidDate: "2026-11-05" }))
      .rejects.toMatchObject({ code: "REFUSED_EXPENSE_CANNOT_BE_PAID" });
    expect(world.repos.movements.items).toHaveLength(1); // opening only
  });

  it("only the owner decides, only finance pays", async () => {
    const { world, company, expenseId } = await setup();
    await expect(world.useCases.approveExpense.execute({ ...company.finance, expenseId })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(world.useCases.approveExpense.execute({ ...company.collaborator, expenseId })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await world.useCases.approveExpense.execute({ ...company.owner, expenseId });
    await expect(world.useCases.markExpensePaid.execute({ ...company.owner, expenseId, paidDate: "2026-11-05" })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  });

  it("a collaborator sees only their own expenses", async () => {
    const { world, company } = await setup();
    const ownerExpense = await world.useCases.submitExpense.execute({
      ...company.owner, category: "Rent", description: "Office", amountMillimes: 2_000_000, expenseDate: "2026-11-15",
    });
    const mine = await world.useCases.listExpenses.execute(company.collaborator);
    expect(mine.map((expense) => expense.submittedBy)).toEqual([company.collaborator.userId]);
    expect(await world.useCases.listExpenses.execute(company.owner)).toHaveLength(2);
    await expect(world.useCases.getExpense.execute({ ...company.collaborator, expenseId: ownerExpense.id }))
      .rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("approval and refusal are recorded in the audit log", async () => {
    const { world, company, expenseId } = await setup();
    await world.useCases.approveExpense.execute({ ...company.owner, expenseId });
    expect(world.repos.audit.items.at(-1)).toMatchObject({ action: "expense.approved", actorId: company.owner.userId });
  });
});

describe("expense edits and receipt link", () => {
  it("the submitter edits a submitted expense; a decision freezes it", async () => {
    const { world, company, expenseId } = await setup();
    const updated = await world.useCases.updateSubmittedExpense.execute({ ...company.collaborator, expenseId, description: "Annual subscription", amountMillimes: 480_000 });
    expect(updated).toMatchObject({ description: "Annual subscription", amountMillimes: 480_000, status: "submitted" });
    await world.useCases.approveExpense.execute({ ...company.owner, expenseId });
    await expect(world.useCases.updateSubmittedExpense.execute({ ...company.collaborator, expenseId, amountMillimes: 1_000 }))
      .rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("a collaborator cannot edit someone else's expense, finance can", async () => {
    const { world, company, expenseId } = await setup();
    const other = await world.useCases.submitExpense.execute({ ...company.finance, category: "Travel", description: "Train", amountMillimes: 50_000, expenseDate: "2026-11-20" });
    await expect(world.useCases.updateSubmittedExpense.execute({ ...company.collaborator, expenseId: other.id, amountMillimes: 1_000 }))
      .rejects.toMatchObject({ code: "ACCESS_DENIED" });
    expect((await world.useCases.updateSubmittedExpense.execute({ ...company.finance, expenseId, category: "Tools" })).category).toBe("Tools");
  });

  it("attaching a receipt keeps the link to open it, which the owner can read", async () => {
    const { world, company, expenseId } = await setup();
    await world.useCases.attachReceipt.execute({ ...company.collaborator, expenseId, fileName: "r.png", content: new Uint8Array([1, 2, 3]), contentType: "image/png" });
    const seen = await world.useCases.getExpense.execute({ ...company.owner, expenseId });
    expect(seen).toMatchObject({ receiptFileId: "file-1", receiptUrl: "https://files.test/file-1.png" });
  });
});
