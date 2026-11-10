import { describe, it, expect } from "vitest";
import { CompanyId, InvoiceId, UserId } from "./ids";
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

describe("identifiers", () => {
  it("rejects empty ids with INVALID_ID", () => {
    expectDomainError(() => CompanyId.from(""), "INVALID_ID");
    expectDomainError(() => UserId.from("   "), "INVALID_ID");
    expectDomainError(() => InvoiceId.from(""), "INVALID_ID");
  });

  it("trims and accepts non-UUID ids (seed data uses readable ids)", () => {
    expect(InvoiceId.from(" invoice-001 ").value).toBe("invoice-001");
  });

  it("generates unique ids", () => {
    expect(CompanyId.next().equals(CompanyId.next())).toBe(false);
  });
});
