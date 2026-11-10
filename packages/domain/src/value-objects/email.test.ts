import { describe, it, expect } from "vitest";
import { Email } from "./email";
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

describe("Email", () => {
  it("accepts a valid email and normalizes it", () => {
    expect(Email.from("  Owner@Demo.Test ").value).toBe("owner@demo.test");
  });

  it.each(["", "no-at-sign", "missing@tld", "spaces in@address"])("rejects %s with INVALID_EMAIL", (value) => {
    expectDomainError(() => Email.from(value), "INVALID_EMAIL");
  });
});
