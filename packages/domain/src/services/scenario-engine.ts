import type { ForecastInputs } from "./forecast-engine";
import type { Hypothesis, HypothesisType } from "../entities/scenario";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

/**
 * BR-25: a simulation never mutates real data. Each strategy returns new
 * arrays with new entries; the input object is only read. The appliers are
 * registered per hypothesis type so a new hypothesis type means one new
 * entry, no if/else chain (OCP).
 */
function applyClientDelay(inputs: ForecastInputs, hypothesis: Extract<Hypothesis, { type: "client_delay" }>): ForecastInputs {
  const known = inputs.receipts.some((receipt) => receipt.sourceId === hypothesis.invoiceId);
  if (!known) {
    throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, `Unknown invoice in client delay: ${hypothesis.invoiceId}`);
  }
  const shifted = inputs.receipts.map((receipt) =>
    receipt.sourceId === hypothesis.invoiceId
      ? { ...receipt, date: receipt.date.addDays(hypothesis.delayDays) }
      : receipt,
  );
  return { ...inputs, receipts: shifted };
}

function applyNewExpense(inputs: ForecastInputs, hypothesis: Extract<Hypothesis, { type: "new_expense" }>): ForecastInputs {
  return {
    ...inputs,
    disbursements: [
      ...inputs.disbursements,
      { sourceId: "scenario:new_expense", label: hypothesis.label, date: hypothesis.date, amount: hypothesis.amount },
    ],
  };
}

function applyExtraIncome(inputs: ForecastInputs, hypothesis: Extract<Hypothesis, { type: "extra_income" }>): ForecastInputs {
  return {
    ...inputs,
    receipts: [
      ...inputs.receipts,
      { sourceId: "scenario:extra_income", label: hypothesis.label, date: hypothesis.date, amount: hypothesis.amount },
    ],
  };
}

/**
 * Mappable dispatch: for each hypothesis type the applier receives exactly
 * the union member of that type. TypeScript checks each record entry and
 * each dispatched call against its own hypothesis member.
 */
const APPLIERS: { readonly [K in HypothesisType]: (inputs: ForecastInputs, hypothesis: Extract<Hypothesis, { type: K }>) => ForecastInputs } = {
  client_delay: applyClientDelay,
  new_expense: applyNewExpense,
  extra_income: applyExtraIncome,
};

/** Narrows the applier to the hypothesis' own type (TypeScript cannot correlate a union index by itself). */
function applyOne<K extends HypothesisType>(inputs: ForecastInputs, hypothesis: Extract<Hypothesis, { type: K }>): ForecastInputs {
  const applier = APPLIERS[hypothesis.type as K];
  return applier(inputs, hypothesis);
}

export class ScenarioEngine {
  /** Applies each hypothesis in order and returns entirely new inputs. */
  static apply(inputs: ForecastInputs, hypotheses: readonly Hypothesis[]): ForecastInputs {
    return hypotheses.reduce(applyOne, inputs);
  }
}
