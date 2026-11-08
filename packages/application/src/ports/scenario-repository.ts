import { Scenario } from "@cashpilot/domain";
import { ScenarioId } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface ScenarioRepository {
  byId(id: ScenarioId): Promise<Scenario | null>;
  byCompany(companyId: CompanyId): Promise<Scenario[]>;
  save(scenario: Scenario): Promise<void>;
}
