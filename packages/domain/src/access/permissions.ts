import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";
import type { MembershipRole } from "./roles";

export type Permission =
  | "dashboard.view"
  | "cash.view"
  | "cash.adjust"
  | "company.manage"
  | "members.manage"
  | "parties.view"
  | "parties.manage"
  | "invoices.view"
  | "invoices.manage"
  | "invoices.export"
  | "payments.record"
  | "expenses.submit"
  | "expenses.viewAll"
  | "expenses.decide"
  | "expenses.pay"
  | "forecast.view"
  | "simulations.use"
  | "retainers.manage"
  | "audit.view";

/**
 * Role → permission map, copied row by row from UNDERSTANDING.md §3.
 * Adding a role or permission is a change to this map only (OCP).
 * Note: "Manage alerts configuration" (owner only) is covered by
 * company.manage — the alert threshold lives on the company.
 */
export const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  owner: [
    "dashboard.view",
    "cash.view",
    "cash.adjust",
    "company.manage",
    "members.manage",
    "parties.view",
    "invoices.view",
    "invoices.export",
    "expenses.submit",
    "expenses.viewAll",
    "expenses.decide",
    "forecast.view",
    "simulations.use",
    "audit.view",
  ],
  finance_manager: [
    "dashboard.view",
    "cash.view",
    "cash.adjust",
    "parties.view",
    "parties.manage",
    "invoices.view",
    "invoices.manage",
    "invoices.export",
    "payments.record",
    "expenses.submit",
    "expenses.viewAll",
    "expenses.pay",
    "forecast.view",
    "simulations.use",
    "retainers.manage",
    "audit.view",
  ],
  collaborator: ["expenses.submit"],
};

export function can(role: MembershipRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertCan(role: MembershipRole, permission: Permission): void {
  if (!can(role, permission)) {
    throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, `Role ${role} cannot ${permission}`);
  }
}
