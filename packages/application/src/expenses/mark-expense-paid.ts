import { CompanyId, UserId, ExpenseId, Money, DateOnly } from "@cashpilot/domain";
import { ExpenseRepository } from "../ports/expense-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { TransactionManager } from "../ports/transaction-manager";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import { CashMovement } from "@cashpilot/domain";

export interface MarkExpensePaidInput {
  userId: string;
  companyId: string;
  expenseId: string;
  paidDate: string;
  amountMillimes?: number;
}

export class MarkExpensePaid {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly movements: CashMovementRepository,
    private readonly memberships: MembershipRepository,
    private readonly transactions: TransactionManager,
  ) {}

  async execute(input: MarkExpensePaidInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    return this.transactions.run(async () => {
      const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
      if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");
      const amount = Money.of(input.amountMillimes ?? expense.amount.amount);
      expense.markPaid(UserId.from(input.userId), DateOnly.from(input.paidDate), amount);
      await this.expenses.save(expense);

      const movement = CashMovement.create({
        companyId: CompanyId.from(input.companyId),
        type: "expense_payment",
        amountMillimes: -amount.amount,
        movementDate: DateOnly.from(input.paidDate),
        sourceType: "expense",
        sourceId: input.expenseId,
        actorId: UserId.from(input.userId),
      });
      await this.movements.save(movement);

      return expense.snapshot();
    });
  }
}
