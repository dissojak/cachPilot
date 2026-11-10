import { authorize } from "../access/authorize";
import { CompanyId, UserId, Expense, Money, DateOnly } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { MembershipRepository } from "../ports/membership-repository";

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
    await authorize(this.memberships, input, "expenses.submit");
    const expense = Expense.create({
      companyId: CompanyId.from(input.companyId),
      submittedBy: UserId.from(input.userId),
      category: input.category,
      description: input.description,
      amount: Money.positive(input.amountMillimes),
      expenseDate: DateOnly.from(input.expenseDate),
      receiptFileId: input.receiptFileId,
    });
    await this.expenses.save(expense);
    return expense.snapshot();
  }
}
