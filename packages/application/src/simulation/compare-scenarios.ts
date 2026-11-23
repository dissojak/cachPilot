import { DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { RunSimulation } from "./run-simulation";

export interface CompareScenariosInput { userId: string; companyId: string; baseScenarioId: string; simulatedScenarioId: string; }

/**
 * Compares two saved scenarios, each with its own hypotheses applied. Each run
 * checks permissions and saves nothing. `comparison` lines up the reference
 * date and the +30/+60/+90 day balances: delta = second scenario − first.
 */
export class CompareScenarios {
  constructor(private readonly runSimulation: RunSimulation) {}

  async execute(input: CompareScenariosInput) {
    if (input.baseScenarioId === input.simulatedScenarioId) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Pick two different scenarios to compare");
    }
    const actor = { userId: input.userId, companyId: input.companyId };
    const [base, simulated] = await Promise.all([
      this.runSimulation.execute({ ...actor, scenarioId: input.baseScenarioId }),
      this.runSimulation.execute({ ...actor, scenarioId: input.simulatedScenarioId }),
    ]);
    const comparison = base.simulated.horizons.map((point, index) => {
      const other = simulated.simulated.horizons[index]!;
      return {
        baseDate: point.date,
        simulatedDate: other.date,
        baseMillimes: point.balanceMillimes,
        simulatedMillimes: other.balanceMillimes,
        deltaMillimes: other.balanceMillimes - point.balanceMillimes,
      };
    });
    return { base, simulated, comparison };
  }
}
