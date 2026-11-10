import type { Retainer } from "@cashpilot/domain";
import type { RetainerId } from "@cashpilot/domain";
import type { CompanyId } from "@cashpilot/domain";

export interface RetainerRepository {
  byId(id: RetainerId): Promise<Retainer | null>;
  byCompany(companyId: CompanyId): Promise<Retainer[]>;
  save(retainer: Retainer): Promise<void>;
}
