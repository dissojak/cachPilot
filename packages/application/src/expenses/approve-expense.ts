import { CompanyId, UserId, ExpenseId, DateOnly } from "@cashpilot/domain";
import { ExpenseRepository } from "../ports/expense-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ApproveExpenseInput {
  actorUserId: string;
  companyId: string;
  expenseId: string;
  decisionDate: string;
  reason?: string;
}

export class ApproveExpense {
  constructor(private readonly expenses: ExpenseRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ApproveExpenseInput) {
    const actor = await this.memberships.byUserAndCompany(UserId.from(input.actorUserId), CompanyId.from(input.companyId));
    if (!actor || actor.role !== "owner") throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Only the owner can approve expenses");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");
    expense.approve(UserId.from(input.actorUserId), DateOnly.from(input.decisionDate), input.reason);
    await this.expenses.save(expense);
    return expense.snapshot();
  }
}
