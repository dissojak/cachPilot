import { Retainer } from "@cashpilot/domain";
import { RetainerId } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface RetainerRepository {
  byId(id: RetainerId): Promise<Retainer | null>;
  byCompany(companyId: CompanyId): Promise<Retainer[]>;
  save(retainer: Retainer): Promise<void>;
}
