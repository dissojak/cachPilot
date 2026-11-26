import { CompanyId, ScenarioId, ScenarioEngine, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { Hypothesis, Invoice } from "@cashpilot/domain";
import type { ScenarioRepository } from "../ports/scenario-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";
import { describeForecast } from "../forecast/forecast-context";
import type { ForecastContextLoader } from "../forecast/forecast-context";

export interface RunSimulationInput { userId: string; companyId: string; scenarioId: string; }

/**
 * M9 "What if?": base projection vs the projection with the scenario's
 * hypotheses. BR-25: nothing is saved — the engine returns new inputs and
 * this use case has no write port at all.
 */
export class RunSimulation {
  constructor(
    private readonly scenarios: ScenarioRepository,
    private readonly loader: ForecastContextLoader,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: RunSimulationInput) {
    await authorize(this.memberships, input, "simulations.use");
    const scenario = await this.scenarios.byId(ScenarioId.from(input.scenarioId));
    if (!scenario || !scenario.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_NOT_FOUND, "Scenario not found");
    }

    const { inputs, invoices } = await this.loader.load(input.companyId, scenario.baseReferenceDate);
    const base = describeForecast(inputs);
    const simulated = describeForecast(ScenarioEngine.apply(inputs, scenario.hypotheses));
    const invoicesById = new Map(invoices.map((invoice) => [invoice.id.value, invoice]));

    return {
      scenario: scenario.snapshot(),
      hypotheses: scenario.hypotheses.map((hypothesis) => describeHypothesis(hypothesis, invoicesById)),
      base,
      simulated,
      comparison: base.horizons.map((point, index) => {
        const simulatedPoint = simulated.horizons[index]!;
        return {
          date: point.date,
          baseMillimes: point.balanceMillimes,
          simulatedMillimes: simulatedPoint.balanceMillimes,
          deltaMillimes: simulatedPoint.balanceMillimes - point.balanceMillimes,
        };
      }),
    };
  }
}

/** What the presentation needs to list a hypothesis by date; amount and date stay raw (formatted by the UI). */
export interface HypothesisView {
  type: Hypothesis["type"];
  label: string;
  invoiceId?: string;
  delayDays?: number;
  amountMillimes?: number;
  date?: string;
  /** Client delay only: the due date before the delay. */
  originalDate?: string;
}

function describeHypothesis(hypothesis: Hypothesis, invoicesById: Map<string, Invoice>): HypothesisView {
  if (hypothesis.type === "client_delay") {
    const invoice = invoicesById.get(hypothesis.invoiceId);
    const number = invoice?.number.value ?? hypothesis.invoiceId;
    return {
      type: hypothesis.type,
      label: `Invoice ${number} paid ${hypothesis.delayDays} days late`,
      invoiceId: hypothesis.invoiceId,
      delayDays: hypothesis.delayDays,
      ...(invoice && {
        amountMillimes: invoice.remaining.amount,
        date: invoice.dueDate.addDays(hypothesis.delayDays).value,
        originalDate: invoice.dueDate.value,
      }),
    };
  }
  return { type: hypothesis.type, label: hypothesis.label, amountMillimes: hypothesis.amount.amount, date: hypothesis.date.value };
}
