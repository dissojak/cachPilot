import { authorize } from "../access/authorize";
import { CompanyId, UserId, ExpenseId, Money, DateOnly } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { MembershipRepository } from "../ports/membership-repository";
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
}

export class UpdateSubmittedExpense {
  constructor(private readonly expenses: ExpenseRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: UpdateSubmittedExpenseInput) {
    const membership = await authorize(this.memberships, input, "expenses.submit");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");

    expense.revise(
      UserId.from(input.userId),
      membership.can("expenses.pay"),
      {
        category: input.category,
        description: input.description,
        amount: input.amountMillimes !== undefined ? Money.positive(input.amountMillimes) : undefined,
        expenseDate: input.expenseDate ? DateOnly.from(input.expenseDate) : undefined,
      },
    );
    await this.expenses.save(expense);
    return expense.snapshot();
  }
}
