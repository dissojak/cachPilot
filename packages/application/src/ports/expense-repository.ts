import type { Expense } from "@cashpilot/domain";
import type { ExpenseId } from "@cashpilot/domain";
import type { CompanyId } from "@cashpilot/domain";

export interface ExpenseRepository {
  byId(id: ExpenseId): Promise<Expense | null>;
  byCompany(companyId: CompanyId): Promise<Expense[]>;
  save(expense: Expense): Promise<void>;
}
