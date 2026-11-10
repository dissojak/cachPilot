import { authorize } from "../access/authorize";
import { CompanyId, ScenarioId, Money, DateOnly } from "@cashpilot/domain";
import type { Hypothesis } from "@cashpilot/domain";
import type { ScenarioRepository } from "../ports/scenario-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

/** The web sends primitives (strings/numbers); the use case maps to the domain union. */
export type HypothesisInput =
  | { type: "client_delay"; invoiceId: string; delayDays: number }
  | { type: "new_expense"; amountMillimes: number; date: string; label: string }
  | { type: "extra_income"; amountMillimes: number; date: string; label: string };

export interface AddHypothesisInput { userId: string; companyId: string; scenarioId: string; hypothesis: HypothesisInput; }

export class AddHypothesis {
  constructor(private readonly scenarios: ScenarioRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: AddHypothesisInput) {
    await authorize(this.memberships, input, "simulations.use");
    const scenario = await this.scenarios.byId(ScenarioId.from(input.scenarioId));
    if (!scenario || !scenario.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_NOT_FOUND, "Scenario not found");

    const hypothesis: Hypothesis = input.hypothesis.type === "client_delay"
      ? { type: "client_delay", invoiceId: input.hypothesis.invoiceId, delayDays: input.hypothesis.delayDays }
      : input.hypothesis.type === "new_expense"
        ? { type: "new_expense", amount: Money.positive(input.hypothesis.amountMillimes), date: DateOnly.from(input.hypothesis.date), label: input.hypothesis.label }
        : { type: "extra_income", amount: Money.positive(input.hypothesis.amountMillimes), date: DateOnly.from(input.hypothesis.date), label: input.hypothesis.label };

    scenario.addHypothesis(hypothesis);
    await this.scenarios.save(scenario);
    return scenario.snapshot();
  }
}
