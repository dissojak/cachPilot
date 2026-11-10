import { CompanyId, UserId, ExpenseId, CashMovement, CashMovementId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { FinancialLedger } from "../ports/financial-ledger";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { IdGenerator } from "../ports/id-generator";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { realizedDate } from "../access/dates";

export interface MarkExpensePaidInput {
  userId: string;
  companyId: string;
  expenseId: string;
  paidDate: string;
}

/** BR-14..BR-16: only an approved expense is paid, once, for its exact amount. */
export class MarkExpensePaid {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly ledger: FinancialLedger,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: MarkExpensePaidInput) {
    await authorize(this.memberships, input, "expenses.pay");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");
    }
    expense.markPaid(UserId.from(input.userId), realizedDate(input.paidDate, this.clock));
    const movement = CashMovement.fromExpensePayment({ id: CashMovementId.from(this.ids.newId()), expense });

    await this.ledger.recordExpensePayment({ expense, movement });
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "expense", entityId: input.expenseId,
      action: "expense.paid", after: movement.snapshot(), at: this.clock.now().toISOString(),
    });
    return expense.snapshot();
  }
}
