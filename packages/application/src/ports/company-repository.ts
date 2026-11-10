import type { Company } from "@cashpilot/domain";
import type { CompanyId } from "@cashpilot/domain";

export interface CompanyRepository {
  byId(id: CompanyId): Promise<Company | null>;
  save(company: Company): Promise<void>;
}
