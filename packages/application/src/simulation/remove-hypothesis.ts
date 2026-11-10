import { CompanyId, ScenarioId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { ScenarioRepository } from "../ports/scenario-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface RemoveHypothesisInput { userId: string; companyId: string; scenarioId: string; index: number; }

export class RemoveHypothesis {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: RemoveHypothesisInput) {
    await authorize(this.memberships, input, "simulations.use");
    const scenario = await this.scenarios.byId(ScenarioId.from(input.scenarioId));
    if (!scenario || !scenario.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_NOT_FOUND, "Scenario not found");
    scenario.removeHypothesis(input.index);
    await this.scenarios.save(scenario);
    return scenario.snapshot();
  }
}
