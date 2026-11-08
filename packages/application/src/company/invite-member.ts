
import {
  CompanyId,
  UserId,
  Membership,
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import type {
  MembershipRepository,
  UserRepository,
} from "../ports";

export interface InviteMemberInput {
  actorUserId: string;
  companyId: string;
  userId: string;
  role: "finance_manager" | "collaborator";
}

export class InviteMember {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly users: UserRepository
  ) {}

  async execute(input: InviteMemberInput) {
    const companyId = CompanyId.from(input.companyId);
    const actorId = UserId.from(input.actorUserId);
    const targetId = UserId.from(input.userId);

    // 1. Verify the actor is an owner
    const actor =
      await this.memberships.byUserAndCompany(
        actorId,
        companyId
      );

    if (!actor || actor.role !== "owner") {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "Only owners can add members"
      );
    }

    // 2. Verify the target user exists
    const user = await this.users.byId(targetId);

    if (!user) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        "User not found"
      );
    }

    // 3. Check whether the user is already a member
    const existingMembership =
      await this.memberships.byUserAndCompany(
        targetId,
        companyId
      );

    if (existingMembership) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.DUPLICATE_OPERATION,
        "User is already a member of this company"
      );
    }

    // 4. Create the membership
    const membership = Membership.create(
      targetId,
      companyId,
      input.role
    );

    await this.memberships.create(membership);

    return {
      userId: input.userId,
      companyId: input.companyId,
      role: input.role,
    };
  }
}
