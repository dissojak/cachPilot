import type { CashMovement, CashMovementId, CompanyId } from "@cashpilot/domain";
/** Read side only: cash movements are written through FinancialLedger. */
export interface CashMovementRepository {
  byId(id: CashMovementId): Promise<CashMovement | null>;
  byCompany(companyId: CompanyId): Promise<CashMovement[]>;
}
