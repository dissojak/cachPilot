import { describe, it, expect } from "vitest";
import { DateOnly } from "./date-only";
import { DomainError } from "../errors/domain-error";
import type { DomainErrorCode } from "../errors/codes";

/** Asserts the call throws a DomainError with the expected code. */
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

describe("DateOnly", () => {
  it("accepts a valid ISO calendar date", () => {
    const date = DateOnly.from("2026-11-10");
    expect(date.value).toBe("2026-11-10");
  });

  it("rejects the wrong shape with INVALID_DATE", () => {
    expectDomainError(() => DateOnly.from("10/11/2026"), "INVALID_DATE");
  });

  it.each(["2026-02-31", "2026-13-01", "2026-00-10", "2026-11-32"])("rejects the impossible date %s", (value) => {
    expectDomainError(() => DateOnly.from(value), "INVALID_DATE");
  });

  it("converts a JS Date to the UTC calendar date", () => {
    const date = DateOnly.fromDate(new Date("2026-11-10T23:30:00.000Z"));
    expect(date.value).toBe("2026-11-10");
  });

  it("adds days across month and year boundaries", () => {
    expect(DateOnly.from("2026-11-10").addDays(30).value).toBe("2026-12-10");
    expect(DateOnly.from("2026-12-31").addDays(1).value).toBe("2027-01-01");
  });

  it("computes whole days until another date", () => {
    expect(DateOnly.from("2026-11-01").daysUntil(DateOnly.from("2026-11-15"))).toBe(14);
    expect(DateOnly.from("2026-11-15").daysUntil(DateOnly.from("2026-11-01"))).toBe(-14);
    expect(DateOnly.from("2026-11-01").daysUntil(DateOnly.from("2026-11-01"))).toBe(0);
  });

  it("compares dates", () => {
    const first = DateOnly.from("2026-11-01");
    const second = DateOnly.from("2026-11-02");
    expect(first.isBefore(second)).toBe(true);
    expect(second.isAfter(first)).toBe(true);
    expect(first.equals(DateOnly.from("2026-11-01"))).toBe(true);
  });
});
