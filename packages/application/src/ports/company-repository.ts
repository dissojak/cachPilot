import { Company } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface CompanyRepository {
  byId(id: CompanyId): Promise<Company | null>;
  save(company: Company): Promise<void>;
}
