import { Party } from "@cashpilot/domain";
import { PartyId } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface PartyRepository {
  byId(id: PartyId): Promise<Party | null>;
  byCompany(companyId: CompanyId): Promise<Party[]>;
  save(party: Party): Promise<void>;
}
