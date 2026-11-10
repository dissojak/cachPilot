import { authorize } from "../access/authorize";
import { CompanyId } from "@cashpilot/domain";
import type { ScenarioRepository } from "../ports/scenario-repository";
import type { MembershipRepository } from "../ports/membership-repository";

export interface ListScenariosInput { userId: string; companyId: string; }

export class ListScenarios {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListScenariosInput) {
    await authorize(this.memberships, input, "simulations.use");
    return (await this.scenarios.byCompany(CompanyId.from(input.companyId))).map((scenario) => scenario.snapshot());
  }
}
