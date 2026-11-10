import { describe, it, expect } from "vitest";
import { can, assertCan, ROLE_PERMISSIONS } from "./permissions";
import type { Permission } from "./permissions";
import { Membership } from "../entities/membership";
import { CompanyId, UserId } from "../value-objects/ids";
import { DomainError } from "../errors/domain-error";

const ALL_PERMISSIONS: Permission[] = [...new Set(Object.values(ROLE_PERMISSIONS).flat())];

describe("ROLE_PERMISSIONS (access matrix, UNDERSTANDING.md §3)", () => {
  it.each<[Permission, boolean, boolean, boolean]>([
    // | permission            | owner | finance | collaborator |
    ["dashboard.view", true, true, false],   // view company dashboard and alerts
    ["cash.view", true, true, false],        // view real balance and cash movements
    ["cash.adjust", true, true, false],      // set/adjust opening balance, corrections
    ["company.manage", true, false, false],  // manage company profile (and alerts config)
    ["members.manage", true, false, false],  // manage members
    ["parties.view", true, true, false],     // view customers and suppliers (owner read-only)
    ["parties.manage", false, true, false],  // create/edit customers and suppliers
    ["invoices.view", true, true, false],    // view all invoices and payments
    ["invoices.manage", false, true, false], // create/validate/cancel invoice drafts
    ["invoices.export", true, true, false],  // export invoice PDF
    ["payments.record", false, true, false], // record total or partial payment
    ["expenses.submit", true, true, true],   // submit an expense (and view own)
    ["expenses.viewAll", true, true, false], // view all expenses
    ["expenses.decide", true, false, false], // approve or refuse an expense
    ["expenses.pay", false, true, false],    // mark an approved expense as paid
    ["forecast.view", true, true, false],    // view forecast (30/60/90)
    ["simulations.use", true, true, false],  // run a simulation, save/compare scenarios
    ["retainers.manage", false, true, false],// original feature: finance manages retainers
    ["audit.view", true, true, false],       // permissions and traceability criterion
  ])("%s → owner=%s finance=%s collaborator=%s", (permission, ownerYes, financeYes, collaboratorYes) => {
    expect(can("owner", permission)).toBe(ownerYes);
    expect(can("finance_manager", permission)).toBe(financeYes);
    expect(can("collaborator", permission)).toBe(collaboratorYes);
  });

  it("denies the owner exactly the five finance-only permissions", () => {
    const ownerDenied = ALL_PERMISSIONS.filter((permission) => !can("owner", permission)).sort();
    expect(ownerDenied).toEqual([
      "expenses.pay",
      "invoices.manage",
      "parties.manage",
      "payments.record",
      "retainers.manage",
    ]);
  });

  it("denies the collaborator everything except expenses.submit", () => {
    const allowed = ALL_PERMISSIONS.filter((permission) => can("collaborator", permission));
    expect(allowed).toEqual(["expenses.submit"]);
  });

  it("assertCan throws ACCESS_DENIED for a missing permission", () => {
    expect(() => assertCan("collaborator", "invoices.manage")).toThrowError(DomainError);
    expect(() => assertCan("finance_manager", "expenses.decide")).toThrowError(DomainError);
    expect(() => assertCan("owner", "members.manage")).not.toThrow();
  });

  it("Membership.can delegates to the policy", () => {
    const membership = Membership.create(UserId.next(), CompanyId.next(), "finance_manager");
    expect(membership.can("payments.record")).toBe(true);
    expect(membership.can("expenses.decide")).toBe(false);
  });
});
