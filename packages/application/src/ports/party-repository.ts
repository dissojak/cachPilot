import type { Party } from "@cashpilot/domain";
import type { PartyId } from "@cashpilot/domain";
import type { CompanyId } from "@cashpilot/domain";

export interface PartyRepository {
  byId(id: PartyId): Promise<Party | null>;
  byCompany(companyId: CompanyId): Promise<Party[]>;
  save(party: Party): Promise<void>;
}
