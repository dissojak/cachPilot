import type { Scenario } from "@cashpilot/domain";
import type { ScenarioId } from "@cashpilot/domain";
import type { CompanyId } from "@cashpilot/domain";

export interface ScenarioRepository {
  byId(id: ScenarioId): Promise<Scenario | null>;
  byCompany(companyId: CompanyId): Promise<Scenario[]>;
  save(scenario: Scenario): Promise<void>;
}
