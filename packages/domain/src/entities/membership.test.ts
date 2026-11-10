import { describe, it, expect } from "vitest";
import { Membership } from "./membership";
import { CompanyId, UserId } from "../value-objects/ids";

const company = CompanyId.next();

describe("Membership", () => {
  it("changes role and the permissions follow", () => {
    const member = Membership.create(UserId.next(), company, "collaborator");
    expect(member.can("payments.record")).toBe(false);
    member.changeRole("finance_manager");
    expect(member.can("payments.record")).toBe(true);
  });

  it("refuses to remove or demote the last owner (P2-3)", () => {
    const owner = Membership.create(UserId.next(), company, "owner");
    const finance = Membership.create(UserId.next(), company, "finance_manager");
    expect(() => Membership.assertNotLastOwner([owner, finance], owner.userId)).toThrow(/at least one owner/);
  });

  it("allows it when another owner remains", () => {
    const a = Membership.create(UserId.next(), company, "owner");
    const b = Membership.create(UserId.next(), company, "owner");
    expect(() => Membership.assertNotLastOwner([a, b], a.userId)).not.toThrow();
  });
});
