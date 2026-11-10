import type { DateOnly } from "../value-objects/date-only";
import type { Money } from "../value-objects/money";
import type { Invoice } from "../entities/invoice";
import type { Expense } from "../entities/expense";
import type { ForecastPoint } from "./forecast-engine";
import { findShortageWindows } from "./forecast-engine";

export type AlertType = "invoice_overdue" | "expense_pending" | "forecast_negative" | "forecast_below_threshold";

export interface Alert {
  type: AlertType;
  entityType: string;
  entityId: string;
  message: string;
  date?: string;
}

export interface EvaluationContext {
  today: DateOnly;
  invoices: readonly Invoice[];
  expenses: readonly Expense[];
  series: readonly ForecastPoint[];
  threshold: Money;
}

type AlertRule = (context: EvaluationContext) => Alert[];

/** BR-28: overdue invoices, expenses waiting for approval, negative forecast. */
const invoiceOverdueAlerts: AlertRule = (context) =>
  context.invoices
    .filter((invoice) => invoice.isOverdue(context.today))
    .map((invoice) => ({
      type: "invoice_overdue" as const,
      entityType: "invoice",
      entityId: invoice.id.value,
      message: `Invoice ${invoice.number.value} is overdue`,
    }));

const expensePendingAlerts: AlertRule = (context) =>
  context.expenses
    .filter((expense) => expense.status === "submitted")
    .map((expense) => ({
      type: "expense_pending" as const,
      entityType: "expense",
      entityId: expense.id.value,
      message: `Expense ${expense.description} is waiting for approval`,
    }));

/** One alert per shortage window (not one per negative day). */
const forecastNegativeAlerts: AlertRule = (context) =>
  findShortageWindows(context.series).map((window) => ({
    type: "forecast_negative" as const,
    entityType: "forecast",
    entityId: window.start.value,
    message: `Cash shortage from ${window.start.value} to ${window.end.value} (lowest ${window.minimum.amount} millimes)`,
    date: window.start.value,
  }));

/** Warns once, on the first day the balance goes below the threshold. */
const forecastBelowThresholdAlerts: AlertRule = (context) => {
  if (!context.threshold.isPositive()) return [];
  const firstBelow = context.series
    .find((point) => !point.balance.isNegative() && point.balance.amount < context.threshold.amount);
  if (!firstBelow) return [];
  return [{
    type: "forecast_below_threshold" as const,
    entityType: "forecast",
    entityId: firstBelow.date.value,
    message: `Forecast goes below the threshold on ${firstBelow.date.value}`,
    date: firstBelow.date.value,
  }];
};

const RULES: AlertRule[] = [
  invoiceOverdueAlerts,
  expensePendingAlerts,
  forecastNegativeAlerts,
  forecastBelowThresholdAlerts,
];

export class AlertEvaluator {
  evaluate(context: EvaluationContext): Alert[] {
    return RULES.flatMap((rule) => rule(context));
  }
}
