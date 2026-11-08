import { CompanyId, UserId } from "@cashpilot/domain";
import { Membership } from "@cashpilot/domain";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ChangeMemberRoleInput {
  actorUserId: string;
  companyId: string;
  userId: string;
  role: "owner" | "finance_manager" | "collaborator";
}

export class ChangeMemberRole {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(input: ChangeMemberRoleInput) {
    const actor = await this.memberships.byUserAndCompany(
      UserId.from(input.actorUserId),
      CompanyId.from(input.companyId),
    );
    if (!actor || actor.role !== "owner") {
      throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Only the owner can change roles");
    }

    const membership = await this.memberships.byUserAndCompany(
      UserId.from(input.userId),
      CompanyId.from(input.companyId),
    );
    if (!membership) {
      throw new DomainError(DOMAIN_ERROR_CODES.USER_NOT_FOUND, "Membership not found");
    }

    const updated = Membership.create(
      UserId.from(input.userId),
      CompanyId.from(input.companyId),
      input.role,
    );
    await this.memberships.save(updated);

    return { userId: input.userId, companyId: input.companyId, role: input.role };
  }
}
