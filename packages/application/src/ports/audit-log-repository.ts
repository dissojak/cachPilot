/** Every financial or security action leaves one entry (traceability, BR-31). */
export type AuditAction =
  | "company.registered"
  | "company.updated"
  | "invoice.validated"
  | "invoice.cancelled"
  | "payment.recorded"
  | "expense.approved"
  | "expense.refused"
  | "expense.updated"
  | "expense.paid"
  | "cash.opening_set"
  | "cash.adjusted"
  | "cash.reversed"
  | "member.invited"
  | "member.role_changed"
  | "retainer.updated"
  | "member.removed";

export interface AuditLogEntry {
  companyId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  /** ISO timestamp from the Clock port. */
  at: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

export interface AuditLogRepository {
  append(entry: AuditLogEntry): Promise<void>;
  byCompany(companyId: string): Promise<AuditLogEntry[]>;
}
