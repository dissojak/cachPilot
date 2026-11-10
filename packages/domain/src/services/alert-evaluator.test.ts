import { describe, it, expect } from "vitest";
import { AlertEvaluator } from "./alert-evaluator";
import { Company } from "../entities/company";
import { Invoice } from "../entities/invoice";
import { Expense } from "../entities/expense";
import { InvoiceNumber } from "../value-objects/invoice-number";
import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";
import { CompanyId, PartyId, InvoiceId, ExpenseId, UserId } from "../value-objects/ids";
import type { ForecastPoint } from "./forecast-engine";

const today = DateOnly.from("2026-11-08");
const actor = UserId.next();
const company = Company.create({ id: CompanyId.next(), name: "Atlas", sector: "agency" });

function point(date: string, balance: number): ForecastPoint {
  return { date: DateOnly.from(date), balance: Money.of(balance) };
}

function overdueInvoice() {
  const invoice = Invoice.create({
    id: InvoiceId.next(), companyId: company.id, customerId: PartyId.next(),
    number: InvoiceNumber.from("INV-001"), issueDate: DateOnly.from("2026-10-01"), dueDate: DateOnly.from("2026-10-25"),
    lines: [{ description: "Work", quantity: 1, unitPrice: Money.positive(3000000) }],
  });
  invoice.validate();
  return invoice;
}

describe("AlertEvaluator (BR-28)", () => {
  it("flags an overdue invoice with its number", () => {
    const invoice = overdueInvoice();
    const alerts = new AlertEvaluator().evaluate({ today, invoices: [invoice], expenses: [], series: [], threshold: Money.zero() });
    expect(alerts).toEqual([{
      type: "invoice_overdue",
      entityType: "invoice",
      entityId: invoice.id.value,
      message: "Invoice INV-001 is overdue",
    }]);
  });

  it("does not flag a fully paid invoice", () => {
    const invoice = overdueInvoice();
    invoice.applyPayment(Money.positive(3000000));
    const alerts = new AlertEvaluator().evaluate({ today, invoices: [invoice], expenses: [], series: [], threshold: Money.zero() });
    expect(alerts).toEqual([]);
  });

  it("flags submitted expenses waiting for approval", () => {
    const expense = Expense.create({
      id: ExpenseId.next(), companyId: company.id, submittedBy: actor,
      category: "Software", description: "Subscription", amount: Money.of(400000), expenseDate: DateOnly.from("2026-11-20"),
    });
    const alerts = new AlertEvaluator().evaluate({ today, invoices: [], expenses: [expense], series: [], threshold: Money.zero() });
    expect(alerts).toEqual([{
      type: "expense_pending",
      entityType: "expense",
      entityId: expense.id.value,
      message: "Expense Subscription is waiting for approval",
    }]);
  });

  it("flags each shortage window once and the first day below the threshold", () => {
    const series = [point("2026-11-09", 2000000), point("2026-11-10", -500000), point("2026-11-11", -1000000), point("2026-11-12", 900000)];
    const alerts = new AlertEvaluator().evaluate({ today, invoices: [], expenses: [], series, threshold: Money.of(1000000) });
    expect(alerts.map((alert) => [alert.type, alert.date])).toEqual([
      ["forecast_negative", "2026-11-10"],
      ["forecast_below_threshold", "2026-11-12"],
    ]);
  });

  it("emits nothing on a healthy forecast", () => {
    const alerts = new AlertEvaluator().evaluate({
      today, invoices: [], expenses: [],
      series: [point("2026-11-09", 5000000), point("2026-11-10", 8000000)],
      threshold: Money.of(1000000),
    });
    expect(alerts).toEqual([]);
  });
});
