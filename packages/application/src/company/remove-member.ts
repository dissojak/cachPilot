import { CompanyId, UserId, Membership, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface RemoveMemberInput {
  userId: string;
  companyId: string;
  memberUserId: string;
}

export class RemoveMember {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RemoveMemberInput) {
    await authorize(this.memberships, input, "members.manage");
    const companyId = CompanyId.from(input.companyId);
    const memberId = UserId.from(input.memberUserId);
    const membership = await this.memberships.byUserAndCompany(memberId, companyId);
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.MEMBERSHIP_NOT_FOUND, "This person is not a member");

    Membership.assertNotLastOwner(await this.memberships.listByCompany(companyId), memberId);
    await this.memberships.remove(memberId, companyId);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "membership", entityId: input.memberUserId,
      action: "member.removed", before: membership.role, at: this.clock.now().toISOString(),
    });
    return { userId: input.memberUserId, companyId: input.companyId };
  }
}
