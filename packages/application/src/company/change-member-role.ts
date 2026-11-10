import { CompanyId, UserId, Membership, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { MembershipRole } from "@cashpilot/domain";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface ChangeMemberRoleInput {
  userId: string;
  companyId: string;
  memberUserId: string;
  role: MembershipRole;
}

export class ChangeMemberRole {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ChangeMemberRoleInput) {
    await authorize(this.memberships, input, "members.manage");
    const companyId = CompanyId.from(input.companyId);
    const memberId = UserId.from(input.memberUserId);
    const membership = await this.memberships.byUserAndCompany(memberId, companyId);
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.MEMBERSHIP_NOT_FOUND, "This person is not a member");

    const before = membership.role;
    if (input.role !== "owner") {
      Membership.assertNotLastOwner(await this.memberships.listByCompany(companyId), memberId);
    }
    membership.changeRole(input.role);
    await this.memberships.save(membership);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "membership", entityId: input.memberUserId,
      action: "member.role_changed", before, after: input.role, at: this.clock.now().toISOString(),
    });
    return { userId: input.memberUserId, companyId: input.companyId, role: input.role };
  }
}
