import { CompanyId, UserId, ExpenseId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface RefuseExpenseInput {
  userId: string;
  companyId: string;
  expenseId: string;
  reason: string;
}

export class RefuseExpense {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RefuseExpenseInput) {
    await authorize(this.memberships, input, "expenses.decide");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");
    expense.refuse(UserId.from(input.userId), this.clock.today(), input.reason);
    await this.expenses.save(expense);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "expense", entityId: input.expenseId,
      action: "expense.refused", reason: input.reason, at: this.clock.now().toISOString(),
    });
    return expense.snapshot();
  }
}
