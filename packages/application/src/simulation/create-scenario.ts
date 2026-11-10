import { CompanyId, UserId, Scenario, DateOnly } from "@cashpilot/domain";
import type { ScenarioRepository } from "../ports/scenario-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface CreateScenarioInput { userId: string; companyId: string; name: string; baseReferenceDate?: string; }

export class CreateScenario {
  constructor(
    private readonly scenarios: ScenarioRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateScenarioInput) {
    await authorize(this.memberships, input, "simulations.use");
    const scenario = Scenario.create({
      companyId: CompanyId.from(input.companyId),
      name: input.name,
      baseReferenceDate: input.baseReferenceDate ? DateOnly.from(input.baseReferenceDate) : this.clock.today(),
      createdBy: UserId.from(input.userId),
    });
    await this.scenarios.save(scenario);
    return scenario.snapshot();
  }
}
