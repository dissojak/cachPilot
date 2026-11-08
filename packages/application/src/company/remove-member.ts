import { CompanyId, UserId } from "@cashpilot/domain";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface RemoveMemberInput {
  actorUserId: string;
  companyId: string;
  userId: string;
}

export class RemoveMember {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(input: RemoveMemberInput) {
    const actor = await this.memberships.byUserAndCompany(
      UserId.from(input.actorUserId),
      CompanyId.from(input.companyId),
    );
    if (!actor || actor.role !== "owner") {
      throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Only the owner can remove members");
    }

    await this.memberships.remove(UserId.from(input.userId), CompanyId.from(input.companyId));
    return { userId: input.userId, companyId: input.companyId };
  }
}
