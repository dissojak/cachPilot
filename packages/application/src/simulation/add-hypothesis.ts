import { CompanyId, UserId, ScenarioId } from "@cashpilot/domain";
import { ScenarioRepository } from "../ports/scenario-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface AddHypothesisInput { userId: string; companyId: string; scenarioId: string; hypothesis: Record<string, unknown>; }

export class AddHypothesis {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: AddHypothesisInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const scenario = await this.scenarios.byId(ScenarioId.from(input.scenarioId));
    if (!scenario || !scenario.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, "Scenario not found");
    scenario.addHypothesis(input.hypothesis as any);
    await this.scenarios.save(scenario);
    return scenario.snapshot();
  }
}
