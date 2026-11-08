import { CompanyId, UserId, ExpenseId, Expense, Money, DateOnly } from "@cashpilot/domain";
import { ExpenseRepository } from "../ports/expense-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface UpdateSubmittedExpenseInput {
  userId: string;
  companyId: string;
  expenseId: string;
  category?: string;
  description?: string;
  amountMillimes?: number;
  expenseDate?: string;
  receiptFileId?: string;
}

export class UpdateSubmittedExpense {
  constructor(private readonly expenses: ExpenseRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: UpdateSubmittedExpenseInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");
    if (expense.status !== "submitted") throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only submitted expenses can be updated");

    const snapshot = expense.snapshot();
    const updated = Expense.create({
      id: ExpenseId.from(input.expenseId),
      companyId: CompanyId.from(input.companyId),
      submittedBy: UserId.from(snapshot.submittedBy),
      category: input.category ?? snapshot.category,
      description: input.description ?? snapshot.description,
      amount: Money.of(input.amountMillimes ?? snapshot.amountMillimes),
      expenseDate: DateOnly.from(input.expenseDate ?? snapshot.expenseDate),
      receiptFileId: input.receiptFileId ?? snapshot.receiptFileId,
    });
    await this.expenses.save(updated);
    return updated.snapshot();
  }
}
