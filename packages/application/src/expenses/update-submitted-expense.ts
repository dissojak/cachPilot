import { authorize } from "../access/authorize";
import { CompanyId, UserId, ExpenseId, Money, DateOnly } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
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
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}
  async execute(input: UpdateSubmittedExpenseInput) {
    const membership = await authorize(this.memberships, input, "expenses.submit");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");

    const before = expense.snapshot();
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
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "expense", entityId: input.expenseId,
      action: "expense.updated", before, after: expense.snapshot(), at: this.clock.now().toISOString(),
    });
    return expense.snapshot();
  }
}
