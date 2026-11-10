import { describe, it, expect } from "vitest";
import { Scenario } from "./scenario";
import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";
import { CompanyId, ScenarioId, UserId } from "../value-objects/ids";
import { DomainError } from "../errors/domain-error";
import type { DomainErrorCode } from "../errors/codes";

function expectDomainError(fn: () => unknown, code: DomainErrorCode) {
  try {
    fn();
    expect.fail(`Expected DomainError with code ${code}`);
  } catch (error) {
    if (error instanceof DomainError) {
      expect(error.code).toBe(code);
    } else {
      expect.fail(`Expected a DomainError but got: ${String(error)}`);
    }
  }
}

const companyId = CompanyId.next();
const creator = UserId.next();
const referenceDate = DateOnly.from("2026-11-01");

function createScenario() {
  return Scenario.create({
    id: ScenarioId.next(), companyId, name: "Late payment",
    baseReferenceDate: referenceDate, createdBy: creator,
  });
}

describe("Scenario.addHypothesis", () => {
  it("stores a client delay with an invoice id and a delay between 1 and 365 days", () => {
    const scenario = createScenario();
    scenario.addHypothesis({ type: "client_delay", invoiceId: "invoice-001", delayDays: 20 });
    expect(scenario.hypotheses).toEqual([{ type: "client_delay", invoiceId: "invoice-001", delayDays: 20 }]);
  });

  it("rejects a client delay without invoice or out of bounds delay", () => {
    const scenario = createScenario();
    expectDomainError(() => scenario.addHypothesis({ type: "client_delay", invoiceId: "  ", delayDays: 20 }), "SCENARIO_HYPOTHESIS_INVALID");
    expectDomainError(() => scenario.addHypothesis({ type: "client_delay", invoiceId: "invoice-001", delayDays: 0 }), "SCENARIO_HYPOTHESIS_INVALID");
    expectDomainError(() => scenario.addHypothesis({ type: "client_delay", invoiceId: "invoice-001", delayDays: 366 }), "SCENARIO_HYPOTHESIS_INVALID");
    expectDomainError(() => scenario.addHypothesis({ type: "client_delay", invoiceId: "invoice-001", delayDays: 1.5 }), "SCENARIO_HYPOTHESIS_INVALID");
  });

  it("rejects amount hypotheses without a positive amount or a label", () => {
    const scenario = createScenario();
    expectDomainError(() => scenario.addHypothesis({
      type: "new_expense", amount: Money.zero(), date: referenceDate, label: "Marketing",
    }), "SCENARIO_HYPOTHESIS_INVALID");
    expectDomainError(() => scenario.addHypothesis({
      type: "new_expense", amount: Money.of(-500000), date: referenceDate, label: "Marketing",
    }), "SCENARIO_HYPOTHESIS_INVALID");
    expectDomainError(() => scenario.addHypothesis({
      type: "extra_income", amount: Money.of(500000), date: referenceDate, label: "  ",
    }), "SCENARIO_HYPOTHESIS_INVALID");
  });

  it("stores amount hypotheses with a trimmed label", () => {
    const scenario = createScenario();
    scenario.addHypothesis({ type: "new_expense", amount: Money.of(750000), date: DateOnly.from("2026-11-20"), label: "  Marketing  " });
    expect(scenario.hypotheses).toEqual([{
      type: "new_expense", amount: Money.of(750000), date: DateOnly.from("2026-11-20"), label: "Marketing",
    }]);
  });
});

describe("Scenario.removeHypothesis", () => {
  it("removes the hypothesis at the given index", () => {
    const scenario = createScenario();
    scenario.addHypothesis({ type: "client_delay", invoiceId: "invoice-001", delayDays: 20 });
    scenario.addHypothesis({ type: "extra_income", amount: Money.of(500000), date: referenceDate, label: "Bonus" });
    scenario.removeHypothesis(0);
    expect(scenario.hypotheses).toHaveLength(1);
    expect(scenario.hypotheses[0]!.type).toBe("extra_income");
  });

  it("rejects an out-of-range index", () => {
    const scenario = createScenario();
    expectDomainError(() => scenario.removeHypothesis(0), "INVALID_INPUT");
  });
});

describe("Scenario.snapshot", () => {
  it("serializes the hypotheses as primitives", () => {
    const scenario = createScenario();
    scenario.addHypothesis({ type: "client_delay", invoiceId: "invoice-001", delayDays: 20 });
    scenario.addHypothesis({ type: "new_expense", amount: Money.of(750000), date: DateOnly.from("2026-11-20"), label: "Marketing" });
    const snapshot = scenario.snapshot();
    expect(snapshot.hypotheses).toEqual([
      { type: "client_delay", invoiceId: "invoice-001", delayDays: 20 },
      { type: "new_expense", amountMillimes: 750000, date: "2026-11-20", label: "Marketing" },
    ]);
  });
});
