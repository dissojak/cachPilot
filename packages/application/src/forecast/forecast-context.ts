import { CompanyId, buildForecastInputs, ForecastEngine, findShortageWindows } from "@cashpilot/domain";
import type { DateOnly, ForecastInputs, ForecastPoint, Invoice, Expense } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { CashMovementRepository } from "../ports/cash-movement-repository";

export const FORECAST_DAYS = 90;

export interface ForecastContext {
  inputs: ForecastInputs;
  invoices: Invoice[];
  expenses: Expense[];
}

/**
 * Loads the company's aggregates once and turns them into forecast inputs
 * with the domain rules (buildForecastInputs). Shared by forecast, alerts,
 * dashboard and simulation so the rules exist in exactly one place (P1-7).
 * Internal to the application layer: not a use case, no permission check.
 */
export class ForecastContextLoader {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly expenses: ExpenseRepository,
    private readonly movements: CashMovementRepository,
  ) {}

  async load(companyId: string, referenceDate: DateOnly): Promise<ForecastContext> {
    const id = CompanyId.from(companyId);
    const [movements, invoices, expenses] = await Promise.all([
      this.movements.byCompany(id),
      this.invoices.byCompany(id),
      this.expenses.byCompany(id),
    ]);
    return { inputs: buildForecastInputs({ referenceDate, movements, invoices, expenses }), invoices, expenses };
  }
}

/** Plain, serializable view of a forecast for the presentation layer. */
export function describeForecast(inputs: ForecastInputs) {
  const engine = new ForecastEngine();
  const series = engine.dailySeries(inputs, FORECAST_DAYS);
  return {
    referenceDate: inputs.referenceDate.value,
    referenceBalanceMillimes: inputs.referenceBalance.amount,
    horizons: engine.horizons(inputs).map(toPoint),
    series: series.map(toPoint),
    shortageWindows: findShortageWindows(series).map((window) => ({
      start: window.start.value,
      end: window.end.value,
      minimumMillimes: window.minimum.amount,
      minimumDate: window.minimumDate.value,
    })),
    receipts: inputs.receipts.map((item) => ({ sourceId: item.sourceId, label: item.label, date: item.date.value, amountMillimes: item.amount.amount })),
    disbursements: inputs.disbursements.map((item) => ({ sourceId: item.sourceId, label: item.label, date: item.date.value, amountMillimes: item.amount.amount })),
  };
}

export function seriesOf(inputs: ForecastInputs): ForecastPoint[] {
  return new ForecastEngine().dailySeries(inputs, FORECAST_DAYS);
}

function toPoint(point: ForecastPoint) {
  return { date: point.date.value, balanceMillimes: point.balance.amount };
}
