/** 2000500 millimes → "2,000.500 DNT" (English format, decided in UNDERSTANDING §0). Integers only. */
export function money(millimes: number) {
  const sign = millimes < 0 ? "−" : "";
  const abs = Math.abs(millimes);
  const dinars = Math.trunc(abs / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${dinars}.${String(abs % 1000).padStart(3, "0")} DNT`;
}

/** Millimes → "2000.500" for an <input> default value. */
export function moneyInput(millimes: number) {
  const sign = millimes < 0 ? "-" : "";
  const abs = Math.abs(millimes);
  return `${sign}${Math.trunc(abs / 1000)}.${String(abs % 1000).padStart(3, "0")}`;
}

/** "2026-11-10" → "10 Nov 2026" without any timezone shift. */
export function date(value: string) {
  const [year, month, day] = value.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${names[Number(month) - 1] ?? ""} ${year}`;
}

export function shortDate(value: string) {
  return date(value).split(" ").slice(0, 2).join(" ");
}

export const statusLabel: Record<string, string> = {
  draft: "Draft",
  validated: "Validated",
  partially_paid: "Partially paid",
  paid: "Paid",
  cancelled: "Cancelled",
  submitted: "Submitted",
  approved: "Approved",
  refused: "Refused",
  active: "Active",
  paused: "Paused",
};

export const roleLabel: Record<string, string> = {
  owner: "Owner",
  finance_manager: "Finance manager",
  collaborator: "Collaborator",
};

/** "2026-11-10T09:30:00.000Z" → "10 Nov 2026, 09:30 UTC" (string slicing, no timezone guess). */
export function dateTime(iso: string) {
  return `${date(iso.slice(0, 10))}, ${iso.slice(11, 16)} UTC`;
}

export const auditActionLabel: Record<string, string> = {
  "company.registered": "Company created",
  "company.updated": "Company updated",
  "invoice.validated": "Invoice validated",
  "invoice.cancelled": "Invoice cancelled",
  "payment.recorded": "Payment recorded",
  "expense.updated": "Expense edited",
  "expense.approved": "Expense approved",
  "expense.refused": "Expense refused",
  "expense.paid": "Expense paid",
  "cash.opening_set": "Opening balance set",
  "cash.adjusted": "Cash adjusted",
  "cash.reversed": "Movement reversed",
  "retainer.updated": "Retainer edited",
  "member.invited": "Member added",
  "member.role_changed": "Role changed",
  "member.removed": "Member removed",
};

export const entityLabel: Record<string, string> = {
  company: "Company",
  membership: "Member",
  invoice: "Invoice",
  expense: "Expense",
  cash_movement: "Cash movement",
  retainer: "Retainer",
};

export const movementLabel: Record<string, string> = {
  opening: "Opening balance",
  invoice_payment: "Invoice payment",
  expense_payment: "Expense payment",
  adjustment: "Adjustment",
  reversal: "Reversal",
};
