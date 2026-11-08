import { CompanyId, UserId, Expense, Money, DateOnly } from "@cashpilot/domain";
import { ExpenseRepository } from "../ports/expense-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface SubmitExpenseInput {
  userId: string;
  companyId: string;
  category: string;
  description: string;
  amountMillimes: number;
  expenseDate: string;
  receiptFileId?: string;
}

export class SubmitExpense {
  constructor(private readonly expenses: ExpenseRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: SubmitExpenseInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const expense = Expense.create({
      companyId: CompanyId.from(input.companyId),
      submittedBy: UserId.from(input.userId),
      category: input.category,
      description: input.description,
      amount: Money.of(input.amountMillimes),
      expenseDate: DateOnly.from(input.expenseDate),
      receiptFileId: input.receiptFileId,
    });
    await this.expenses.save(expense);
    return expense.snapshot();
  }
}
