import { describe, it, expect } from "vitest";
import { Company } from "./company";
import { Money } from "../value-objects/money";
import { CompanyId } from "../value-objects/ids";
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

describe("Company", () => {
  it("creates with a default zero threshold and trimmed names", () => {
    const company = Company.create({ name: "  Atlas Studio ", sector: " agency " });
    expect(company.name).toBe("Atlas Studio");
    expect(company.sector).toBe("agency");
    expect(company.forecastThreshold.isZero()).toBe(true);
  });

  it("has no opening balance: the initial cash is a cash movement (D2)", () => {
    const snapshot = Company.create({ name: "Atlas", sector: "agency" }).snapshot();
    expect("openingBalanceMillimes" in snapshot).toBe(false);
  });

  it("rejects an empty name or sector", () => {
    expectDomainError(() => Company.create({ name: "   ", sector: "agency" }), "INVALID_INPUT");
    expectDomainError(() => Company.create({ name: "Atlas", sector: "  " }), "INVALID_INPUT");
  });

  it("renames with a non-empty name", () => {
    const company = Company.create({ name: "Atlas", sector: "agency" });
    company.rename("  Atlas Studio  ");
    expect(company.name).toBe("Atlas Studio");
    expectDomainError(() => company.rename("   "), "INVALID_INPUT");
  });

  it("changes the sector with a non-empty value", () => {
    const company = Company.create({ name: "Atlas", sector: "agency" });
    company.changeSector("training center");
    expect(company.sector).toBe("training center");
    expectDomainError(() => company.changeSector("  "), "INVALID_INPUT");
  });

  it("sets a non-negative forecast threshold", () => {
    const company = Company.create({ name: "Atlas", sector: "agency" });
    company.setForecastThreshold(Money.of(1000000));
    expect(company.forecastThreshold.amount).toBe(1000000);
    expectDomainError(() => company.setForecastThreshold(Money.of(-1)), "INVALID_INPUT");
  });

  it("round-trips through restore", () => {
    const restored = Company.restore({
      id: CompanyId.next(),
      name: "Atlas Studio",
      sector: "digital agency",
      forecastThreshold: Money.of(1000000),
    });
    expect(restored.snapshot()).toMatchObject({
      name: "Atlas Studio",
      sector: "digital agency",
      forecastThresholdMillimes: 1000000,
    });
  });
});
