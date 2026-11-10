import type { CashMovement, CompanyId } from "@cashpilot/domain";

/** Read side only: cash movements are written through FinancialLedger. */
export interface CashMovementRepository {
  byCompany(companyId: CompanyId): Promise<CashMovement[]>;
}
