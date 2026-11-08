import { Expense } from "@cashpilot/domain";
import { ExpenseId } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface ExpenseRepository {
  byId(id: ExpenseId): Promise<Expense | null>;
  byCompany(companyId: CompanyId): Promise<Expense[]>;
  save(expense: Expense): Promise<void>;
}
