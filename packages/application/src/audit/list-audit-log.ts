import { UserId } from "@cashpilot/domain";
import type { AuditLogRepository, AuditAction } from "../ports/audit-log-repository";
import type { UserRepository } from "../ports/user-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface ListAuditLogInput {
  userId: string;
  companyId: string;
  /** Keeps one kind of subject: "invoice", "expense", "cash_movement", "membership", "company". */
  entityType?: string;
  limit?: number;
}

export interface AuditLogView {
  at: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  reason?: string;
}

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

/**
 * BR-31 traceability: who did what and when, newest first. Reserved to the
 * roles that hold `audit.view`. Actor names are resolved here so the page
 * only displays.
 */
export class ListAuditLog {
  constructor(
    private readonly audit: AuditLogRepository,
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: ListAuditLogInput): Promise<AuditLogView[]> {
    await authorize(this.memberships, input, "audit.view");
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

    // sorted here so the result does not depend on the adapter's own order
    const entries = (await this.audit.byCompany(input.companyId))
      .filter((entry) => !input.entityType || entry.entityType === input.entityType)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);

    const actorIds = [...new Set(entries.map((entry) => entry.actorId))];
    const names = new Map(await Promise.all(actorIds.map(async (id) => {
      const user = await this.users.byId(UserId.from(id));
      return [id, user?.name ?? "a former member"] as const;
    })));

    return entries.map((entry) => ({
      at: entry.at,
      actorId: entry.actorId,
      actorName: names.get(entry.actorId) ?? "a former member",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      reason: entry.reason,
    }));
  }
}
