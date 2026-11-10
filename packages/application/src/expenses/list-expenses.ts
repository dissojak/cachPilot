import { CompanyId } from "@cashpilot/domain";
import type { ExpenseStatus } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface ListExpensesInput { userId: string; companyId: string; status?: ExpenseStatus; }

/** A collaborator only sees the expenses they submitted (UNDERSTANDING §3). */
export class ListExpenses {
  constructor(private readonly expenses: ExpenseRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListExpensesInput) {
    const membership = await authorize(this.memberships, input, "expenses.submit");
    const seesAll = membership.can("expenses.viewAll");
    const items = await this.expenses.byCompany(CompanyId.from(input.companyId));
    return items
      .map((item) => item.snapshot())
      .filter((item) => seesAll || item.submittedBy === input.userId)
      .filter((item) => !input.status || item.status === input.status)
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  }
}
