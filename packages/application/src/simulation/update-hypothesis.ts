import { CompanyId, ScenarioId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { ScenarioRepository } from "../ports/scenario-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";
import { toHypothesis } from "./add-hypothesis";
import type { HypothesisInput } from "./add-hypothesis";

export interface UpdateHypothesisInput { userId: string; companyId: string; scenarioId: string; index: number; hypothesis: HypothesisInput; }

/** Edits a hypothesis of a scenario. Only the scenario changes, never the real data (BR-25). */
export class UpdateHypothesis {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: UpdateHypothesisInput) {
    await authorize(this.memberships, input, "simulations.use");
    const scenario = await this.scenarios.byId(ScenarioId.from(input.scenarioId));
    if (!scenario || !scenario.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_NOT_FOUND, "Scenario not found");
    scenario.replaceHypothesis(input.index, toHypothesis(input.hypothesis));
    await this.scenarios.save(scenario);
    return scenario.snapshot();
  }
}
