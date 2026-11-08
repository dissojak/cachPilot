import { CompanyId, UserId } from "@cashpilot/domain";
import { ScenarioRepository } from "../ports/scenario-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ListScenariosInput { userId: string; companyId: string; }

export class ListScenarios {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListScenariosInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    return (await this.scenarios.byCompany(CompanyId.from(input.companyId))).map((scenario) => scenario.snapshot());
  }
}
