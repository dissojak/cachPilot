import { CompanyId, UserId, Scenario, DateOnly } from "@cashpilot/domain";
import { ScenarioRepository } from "../ports/scenario-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface CreateScenarioInput { userId: string; companyId: string; name: string; baseReferenceDate?: string; }

export class CreateScenario {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: CreateScenarioInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const scenario = Scenario.create({
      companyId: CompanyId.from(input.companyId),
      name: input.name,
      baseReferenceDate: DateOnly.from(input.baseReferenceDate ?? new Date().toISOString().slice(0, 10)),
      createdBy: UserId.from(input.userId),
    });
    await this.scenarios.save(scenario);
    return scenario.snapshot();
  }
}
