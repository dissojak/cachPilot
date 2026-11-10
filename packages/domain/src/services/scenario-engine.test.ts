import { describe, it, expect } from "vitest";
import { buildForecastInputs, type ForecastInputs } from "./forecast-engine";
import { ScenarioEngine } from "./scenario-engine";
import { Company } from "../entities/company";
import { Party } from "../entities/party";
import { Invoice } from "../entities/invoice";
import { CashMovement } from "../entities/cash-movement";
import { InvoiceNumber } from "../value-objects/invoice-number";
import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";
import { CompanyId, PartyId, InvoiceId, UserId, CashMovementId } from "../value-objects/ids";
import { DomainError } from "../errors/domain-error";

const referenceDate = DateOnly.from("2026-11-01");
const actor = UserId.next();
const company = Company.create({ id: CompanyId.next(), name: "Atlas", sector: "agency" });
const customer = Party.create({ id: PartyId.next(), companyId: company.id, type: "customer", name: "Acme" });

function invoice(id: string, dueDate: string) {
  const created = Invoice.create({
    id: InvoiceId.from(id), companyId: company.id, customerId: customer.id,
    number: InvoiceNumber.from(id.replace("invoice-", "INV-")), issueDate: referenceDate, dueDate: DateOnly.from(dueDate),
    lines: [{ description: "Work", quantity: 1, unitPrice: Money.positive(3000000) }],
  });
  created.validate();
  return created;
}

function baseInputs(): ForecastInputs {
  const opening = CashMovement.opening({
    id: CashMovementId.next(), companyId: company.id, actorId: actor,
    date: referenceDate, amount: Money.of(5000000),
  });
  return buildForecastInputs({ referenceDate, movements: [opening], invoices: [invoice("invoice-001", "2026-11-10")], expenses: [] });
}

describe("ScenarioEngine.apply (BR-25, BR-26)", () => {
  it("delays only the invoice the hypothesis points at", () => {
    const inputs = baseInputs();
    const otherInvoice = invoice("invoice-002", "2026-11-10");
    const withTwo = buildForecastInputs({
      referenceDate,
      movements: [CashMovement.opening({
        id: CashMovementId.next(), companyId: company.id, actorId: actor, date: referenceDate, amount: Money.of(5000000),
      })],
      invoices: [invoice("invoice-001", "2026-11-10"), otherInvoice],
      expenses: [],
    });

    const simulated = ScenarioEngine.apply(withTwo, [{ type: "client_delay", invoiceId: otherInvoice.id.value, delayDays: 20 }]);
    expect(simulated.receipts.find((receipt) => receipt.sourceId === "invoice-001")!.date.value).toBe("2026-11-10");
    expect(simulated.receipts.find((receipt) => receipt.sourceId === otherInvoice.id.value)!.date.value).toBe("2026-11-30");
    expect(simulated.referenceBalance.amount).toBe(inputs.referenceBalance.amount);
  });

  it("never mutates the inputs it is given", () => {
    const inputs = baseInputs();
    const applied = ScenarioEngine.apply(inputs, [{ type: "client_delay", invoiceId: "invoice-001", delayDays: 20 }]);
    expect(inputs.receipts[0]!.date.value).toBe("2026-11-10");
    expect(applied.receipts[0]!.date.value).toBe("2026-11-30");
    expect(applied.receipts).not.toBe(inputs.receipts);
  });

  it("rejects a delay on an unknown invoice", () => {
    const inputs = baseInputs();
    expect(() => ScenarioEngine.apply(inputs, [{ type: "client_delay", invoiceId: "invoice-999", delayDays: 5 }]))
      .toThrow(DomainError);
  });

  it("adds a new expense as a disbursement and extra income as a receipt", () => {
    const inputs = baseInputs();
    const simulated = ScenarioEngine.apply(inputs, [
      { type: "new_expense", amount: Money.positive(750000), date: DateOnly.from("2026-11-20"), label: "Marketing" },
      { type: "extra_income", amount: Money.positive(1500000), date: DateOnly.from("2026-11-22"), label: "Training day" },
    ]);
    expect(simulated.disbursements).toHaveLength(1);
    expect(simulated.disbursements[0]!.label).toBe("Marketing");
    expect(simulated.disbursements[0]!.amount.amount).toBe(750000);
    expect(simulated.receipts).toHaveLength(2);
    expect(simulated.receipts[1]!.amount.amount).toBe(1500000);
  });
});
