import type { RunSimulation } from "./run-simulation";

export interface CompareScenariosInput { userId: string; companyId: string; baseScenarioId: string; simulatedScenarioId: string; }

/** Compares two saved scenarios; each run checks permissions and saves nothing. */
export class CompareScenarios {
  constructor(private readonly runSimulation: RunSimulation) {}

  async execute(input: CompareScenariosInput) {
    const actor = { userId: input.userId, companyId: input.companyId };
    const [base, simulated] = await Promise.all([
      this.runSimulation.execute({ ...actor, scenarioId: input.baseScenarioId }),
      this.runSimulation.execute({ ...actor, scenarioId: input.simulatedScenarioId }),
    ]);
    return { base, simulated };
  }
}
