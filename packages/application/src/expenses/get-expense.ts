import { CompanyId, ExpenseId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface GetExpenseInput { userId: string; companyId: string; expenseId: string; }

export class GetExpense {
  constructor(private readonly expenses: ExpenseRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: GetExpenseInput) {
    const membership = await authorize(this.memberships, input, "expenses.submit");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    const visible = expense
      && expense.companyId.equals(CompanyId.from(input.companyId))
      && (membership.can("expenses.viewAll") || expense.snapshot().submittedBy === input.userId);
    // Someone else's expense looks "not found" to a collaborator: no information leak.
    if (!expense || !visible) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");
    return expense.snapshot();
  }
}
