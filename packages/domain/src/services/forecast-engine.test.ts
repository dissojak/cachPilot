import { describe, it, expect } from "vitest";
import { buildForecastInputs, ForecastEngine, findShortageWindows } from "./forecast-engine";
import { ScenarioEngine } from "./scenario-engine";
import { Company } from "../entities/company";
import { Party } from "../entities/party";
import { Invoice, type InvoiceLineInput } from "../entities/invoice";
import { Expense } from "../entities/expense";
import { CashMovement } from "../entities/cash-movement";
import { InvoiceNumber } from "../value-objects/invoice-number";
import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";
import { CompanyId, PartyId, InvoiceId, ExpenseId, UserId, CashMovementId, PaymentId } from "../value-objects/ids";
import { Payment } from "../entities/payment";

const referenceDate = DateOnly.from("2026-11-01");
const actor = UserId.next();
const owner = UserId.next();

function buildForecast(inputs: {
  movements: CashMovement[];
  invoices: Invoice[];
  expenses: Expense[];
}) {
  return buildForecastInputs({ referenceDate, movements: inputs.movements, invoices: inputs.invoices, expenses: inputs.expenses });
}

/** Example A from docs/UNDERSTANDING.md §5: 5 000 DT opening, invoice 3 000 DT due 10 Nov, expense 6 000 DT on 15 Nov. */
function exampleA() {
  const company = Company.create({ id: CompanyId.next(), name: "Atlas", sector: "agency" });
  const customer = Party.create({ id: PartyId.next(), companyId: company.id, type: "customer", name: "Acme" });
  const line: InvoiceLineInput[] = [{ description: "Work", quantity: 1, unitPrice: Money.positive(3000000) }];
  const invoice = Invoice.create({
    id: InvoiceId.next(), companyId: company.id, customerId: customer.id,
    number: InvoiceNumber.from("INV-001"), issueDate: DateOnly.from("2026-11-01"), dueDate: DateOnly.from("2026-11-10"), lines: line,
  });
  invoice.validate();
  const expense = Expense.create({
    id: ExpenseId.next(), companyId: company.id, submittedBy: actor,
    category: "Rent", description: "Office rent", amount: Money.positive(6000000), expenseDate: DateOnly.from("2026-11-15"),
  });
  expense.approve(owner, DateOnly.from("2026-11-01"));
  const opening = CashMovement.opening({
    id: CashMovementId.next(), companyId: company.id, actorId: actor,
    date: DateOnly.from("2026-11-01"), amount: Money.of(5000000),
  });
  return { company, invoice, expense, opening };
}

describe("buildForecastInputs (BR-17, BR-21, BR-22)", () => {
  it("collects validated invoices as receipts and approved expenses as disbursements", () => {
    const data = exampleA();
    const inputs = buildForecast({ movements: [data.opening], invoices: [data.invoice], expenses: [data.expense] });
    expect(inputs.referenceBalance.amount).toBe(5000000);
    expect(inputs.receipts).toEqual([{
      sourceId: data.invoice.id.value,
      label: "INV-001",
      date: DateOnly.from("2026-11-10"),
      amount: Money.of(3000000),
    }]);
    expect(inputs.disbursements).toEqual([{
      sourceId: data.expense.id.value,
      label: "Office rent",
      date: DateOnly.from("2026-11-15"),
      amount: Money.of(6000000),
    }]);
  });

  it("excludes cancelled invoices (BR-21)", () => {
    const data = exampleA();
    data.invoice.cancel({ hasPayments: false, by: owner, on: referenceDate, reason: "Wrong customer" });
    const inputs = buildForecast({ movements: [data.opening], invoices: [data.invoice], expenses: [data.expense] });
    expect(inputs.receipts).toEqual([]);
  });

  it("excludes refused and paid expenses (BR-22)", () => {
    const company = Company.create({ id: CompanyId.next(), name: "Atlas", sector: "agency" });
    const refused = Expense.create({
      id: ExpenseId.next(), companyId: company.id, submittedBy: actor,
      category: "Meals", description: "Team lunch", amount: Money.positive(120000), expenseDate: DateOnly.from("2026-11-15"),
    });
    refused.refuse(owner, referenceDate, "Not needed");
    const refusedInputs = buildForecast({ movements: [], invoices: [], expenses: [refused] });
    expect(refusedInputs.disbursements).toEqual([]);

    const data = exampleA();
    data.expense.markPaid(owner, referenceDate);
    const inputs = buildForecast({ movements: [], invoices: [], expenses: [data.expense] });
    expect(inputs.disbursements).toEqual([]);
  });
});

describe("ForecastEngine (BR-20)", () => {
  it("Example A horizons: 5 000 DT at ref, 2 000 DT from 15 Nov on", () => {
    const data = exampleA();
    const inputs = buildForecast({ movements: [data.opening], invoices: [data.invoice], expenses: [data.expense] });
    const points = new ForecastEngine().horizons(inputs);

    expect(points.map((point) => point.balance.amount)).toEqual([
      5000000, // 1 Nov (ref): nothing due yet
      2000000, // 1 Dec (+30): receipt counted once, disbursement counted
      2000000, // 1 Jan (+60)
      2000000, // 1 Feb (+90)
    ]);
  });

  it("Example A daily series: 8 000 DT on 10 Nov, 2 000 DT on 15 Nov", () => {
    const data = exampleA();
    const inputs = buildForecast({ movements: [data.opening], invoices: [data.invoice], expenses: [data.expense] });
    const series = new ForecastEngine().dailySeries(inputs, 20);
    const balanceOn = (date: string) => series.find((point) => point.date.value === date)!.balance.amount;
    expect(balanceOn("2026-11-10")).toBe(8000000);
    expect(balanceOn("2026-11-15")).toBe(2000000);
  });

  it("partial payment variant: 1 000 DT received on 5 Nov, 6 000 DT balance, 2 000 DT forecast at 15 Nov", () => {
    const data = exampleA();
    data.invoice.applyPayment(Money.positive(1000000));
    const payment = Payment.create({
      id: PaymentId.next(), companyId: data.company.id, invoiceId: data.invoice.id,
      amount: Money.positive(1000000), paymentDate: DateOnly.from("2026-11-05"), method: "bank_transfer", recordedBy: actor,
    });
    const paymentMovement = CashMovement.fromInvoicePayment({ id: CashMovementId.next(), payment });

    // Spec: the variant is seen from a reference date after the payment,
    // so the real balance includes the received 1 000 DT.
    const inputs = buildForecastInputs({
      referenceDate: DateOnly.from("2026-11-08"),
      movements: [data.opening, paymentMovement],
      invoices: [data.invoice],
      expenses: [data.expense],
    });
    expect(inputs.referenceBalance.amount).toBe(6000000);
    expect(inputs.receipts[0]!.amount.amount).toBe(2000000);

    const on15 = new ForecastEngine().balanceAt(inputs, DateOnly.from("2026-11-15"));
    expect(on15.amount).toBe(2000000);
  });

  it("overdue variant: an overdue invoice is inside every forecast horizon", () => {
    const company = Company.create({ id: CompanyId.next(), name: "Atlas", sector: "agency" });
    const customer = Party.create({ id: PartyId.next(), companyId: company.id, type: "customer", name: "Acme" });
    const invoice = Invoice.create({
      id: InvoiceId.next(), companyId: company.id, customerId: customer.id,
      number: InvoiceNumber.from("INV-002"), issueDate: DateOnly.from("2026-10-01"), dueDate: DateOnly.from("2026-10-25"),
      lines: [{ description: "Work", quantity: 1, unitPrice: Money.positive(3000000) }],
    });
    invoice.validate();
    const opening = CashMovement.opening({
      id: CashMovementId.next(), companyId: company.id, actorId: actor,
      date: DateOnly.from("2026-11-01"), amount: Money.of(5000000),
    });
    const inputs = buildForecast({ movements: [opening], invoices: [invoice], expenses: [] });
    const points = new ForecastEngine().horizons(inputs);
    expect(points.map((point) => point.balance.amount)).toEqual([8000000, 8000000, 8000000, 8000000]);
  });
});

describe("findShortageWindows (BR-27)", () => {
  it("Example B: a 20-day client delay has one shortage window 15 Nov → 29 Nov, minimum −1 000 DT on 15 Nov", () => {
    const data = exampleA();
    const base = buildForecast({ movements: [data.opening], invoices: [data.invoice], expenses: [data.expense] });
    const simulated = ScenarioEngine.apply(base, [{ type: "client_delay", invoiceId: data.invoice.id.value, delayDays: 20 }]);

    const series = new ForecastEngine().dailySeries(simulated, 90);
    const balanceOn = (date: string) => series.find((point) => point.date.value === date)!.balance.amount;
    expect(balanceOn("2026-11-10")).toBe(5000000);
    expect(balanceOn("2026-11-15")).toBe(-1000000);
    expect(balanceOn("2026-11-30")).toBe(2000000);

    const windows = findShortageWindows(series);
    expect(windows).toHaveLength(1);
    expect(windows[0]!.start.value).toBe("2026-11-15");
    expect(windows[0]!.end.value).toBe("2026-11-29");
    expect(windows[0]!.minimum.amount).toBe(-1000000);
    expect(windows[0]!.minimumDate.value).toBe("2026-11-15");
  });

  it("finds separate windows when the balance recovers between dips", () => {
    const company = Company.create({ id: CompanyId.next(), name: "Atlas", sector: "agency" });
    const opening = CashMovement.opening({
      id: CashMovementId.next(), companyId: company.id, actorId: actor,
      date: DateOnly.from("2026-11-01"), amount: Money.of(3000000),
    });
    const line: InvoiceLineInput[] = [{ description: "Work", quantity: 1, unitPrice: Money.positive(2000000) }];
    const invoiceA = Invoice.create({
      id: InvoiceId.next(), companyId: company.id, customerId: PartyId.next(),
      number: InvoiceNumber.from("INV-003"), issueDate: DateOnly.from("2026-11-01"), dueDate: DateOnly.from("2026-11-18"), lines: line,
    });
    invoiceA.validate();
    const invoiceBLines: InvoiceLineInput[] = [{ description: "More work", quantity: 1, unitPrice: Money.positive(3000000) }];
    const invoiceB = Invoice.create({
      id: InvoiceId.next(), companyId: company.id, customerId: PartyId.next(),
      number: InvoiceNumber.from("INV-004"), issueDate: DateOnly.from("2026-11-01"), dueDate: DateOnly.from("2026-11-25"), lines: invoiceBLines,
    });
    invoiceB.validate();
    const expense1 = Expense.create({
      id: ExpenseId.next(), companyId: company.id, submittedBy: actor,
      category: "Rent", description: "Office rent", amount: Money.positive(4000000), expenseDate: DateOnly.from("2026-11-15"),
    });
    expense1.approve(owner, DateOnly.from("2026-11-01"));
    const expense2 = Expense.create({
      id: ExpenseId.next(), companyId: company.id, submittedBy: actor,
      category: "Fees", description: "Bank fees", amount: Money.positive(2000000), expenseDate: DateOnly.from("2026-11-20"),
    });
    expense2.approve(owner, DateOnly.from("2026-11-01"));

    const inputs = buildForecast({ movements: [opening], invoices: [invoiceA, invoiceB], expenses: [expense1, expense2] });
    const series = new ForecastEngine().dailySeries(inputs, 60);
    const windows = findShortageWindows(series);
    // 15–17 Nov at −1 000 DT, recovery on 18–19 Nov, then 20–24 Nov at −1 000 DT again.
    expect(windows.map((window) => [window.start.value, window.end.value, window.minimum.amount])).toEqual([
      ["2026-11-15", "2026-11-17", -1000000],
      ["2026-11-20", "2026-11-24", -1000000],
    ]);
  });
});
