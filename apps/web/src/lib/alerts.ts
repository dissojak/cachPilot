import type { Alert, AlertType } from "@cashpilot/application";

/** Where an alert leads: the invoice or expense concerned, or the forecast. */
export function alertHref(alert: Alert): string {
  switch (alert.type) {
    case "invoice_overdue": return `/invoices/${alert.entityId}`;
    case "expense_pending": return `/expenses/${alert.entityId}`;
    case "forecast_negative":
    case "forecast_below_threshold": return "/forecast";
  }
}

export const alertTypeLabel: Record<AlertType, string> = {
  invoice_overdue: "Overdue invoice",
  expense_pending: "Expense to approve",
  forecast_negative: "Cash shortage",
  forecast_below_threshold: "Below threshold",
};

export const alertTone: Record<AlertType, "danger" | "warning"> = {
  invoice_overdue: "danger",
  expense_pending: "warning",
  forecast_negative: "danger",
  forecast_below_threshold: "warning",
};

export const alertFilters: { label: string; value?: AlertType }[] = [
  { label: "All" },
  { label: "Overdue invoices", value: "invoice_overdue" },
  { label: "Expenses to approve", value: "expense_pending" },
  { label: "Cash shortage", value: "forecast_negative" },
  { label: "Below threshold", value: "forecast_below_threshold" },
];
