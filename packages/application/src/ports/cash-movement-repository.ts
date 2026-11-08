import { CashMovement } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface CashMovementRepository {
  byCompany(companyId: CompanyId): Promise<CashMovement[]>;
  save(movement: CashMovement): Promise<void>;
}
