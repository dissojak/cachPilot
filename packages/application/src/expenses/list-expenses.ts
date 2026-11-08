import { CompanyId, UserId } from "@cashpilot/domain";
import { ExpenseRepository } from "../ports/expense-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ListExpensesInput { userId: string; companyId: string; status?: string; }

export class ListExpenses {
  constructor(private readonly expenses: ExpenseRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListExpensesInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const items = await this.expenses.byCompany(CompanyId.from(input.companyId));
    return input.status ? items.filter((item) => item.status === input.status).map((item) => item.snapshot()) : items.map((item) => item.snapshot());
  }
}
