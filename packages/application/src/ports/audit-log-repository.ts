export interface AuditLogEntry {
  companyId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

export interface AuditLogRepository {
  save(entry: AuditLogEntry): Promise<void>;
  byCompany(companyId: string): Promise<AuditLogEntry[]>;
}
