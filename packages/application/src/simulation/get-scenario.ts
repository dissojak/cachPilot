import { authorize } from "../access/authorize";
import { CompanyId, ScenarioId } from "@cashpilot/domain";
import type { ScenarioRepository } from "../ports/scenario-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface GetScenarioInput { userId: string; companyId: string; scenarioId: string; }

export class GetScenario {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: GetScenarioInput) {
    await authorize(this.memberships, input, "simulations.use");
    const scenario = await this.scenarios.byId(ScenarioId.from(input.scenarioId));
    if (!scenario || !scenario.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_NOT_FOUND, "Scenario not found");
    return scenario.snapshot();
  }
}
