import { CompanyId, UserId } from "@cashpilot/domain";
import { Membership } from "@cashpilot/domain";
import { MembershipRepository } from "../ports/membership-repository";
import { UserRepository } from "../ports/user-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface InviteMemberInput {
  actorUserId: string;
  companyId: string;
  userId: string;
  role: "owner" | "finance_manager" | "collaborator";
}

export class InviteMember {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(input: InviteMemberInput) {
    const actor = await this.memberships.byUserAndCompany(
      UserId.from(input.actorUserId),
      CompanyId.from(input.companyId),
    );
    if (!actor || actor.role !== "owner") {
      throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Only the owner can invite members");
    }

    const user = await this.users.byId(UserId.from(input.userId));
    if (!user) {
      throw new DomainError(DOMAIN_ERROR_CODES.USER_NOT_FOUND, "User not found");
    }

    const membership = Membership.create(
      UserId.from(input.userId),
      CompanyId.from(input.companyId),
      input.role,
    );
    await this.memberships.save(membership);

    return { userId: input.userId, companyId: input.companyId, role: input.role };
  }
}
