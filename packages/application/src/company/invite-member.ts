import { CompanyId, Membership, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { MembershipRole } from "@cashpilot/domain";
import type { MembershipRepository } from "../ports/membership-repository";
import type { UserRepository } from "../ports/user-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface InviteMemberInput {
  userId: string;
  companyId: string;
  /** The person must have signed in once so their account exists. */
  email: string;
  role: MembershipRole;
}

export class InviteMember {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: InviteMemberInput) {
    await authorize(this.memberships, input, "members.manage");
    const user = await this.users.byEmail(input.email.trim().toLowerCase());
    if (!user) {
      throw new DomainError(DOMAIN_ERROR_CODES.USER_NOT_FOUND, "No account with this e-mail yet: ask them to sign in once first");
    }
    const companyId = CompanyId.from(input.companyId);
    if (await this.memberships.byUserAndCompany(user.id, companyId)) {
      throw new DomainError(DOMAIN_ERROR_CODES.DUPLICATE_OPERATION, "This person is already a member");
    }
    await this.memberships.save(Membership.create(user.id, companyId, input.role));
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "membership", entityId: user.id.value,
      action: "member.invited", after: input.role, at: this.clock.now().toISOString(),
    });
    return { userId: user.id.value, companyId: input.companyId, role: input.role };
  }
}
