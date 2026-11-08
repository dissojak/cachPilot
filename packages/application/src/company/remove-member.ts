
import {
  CompanyId,
  UserId,
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import type {
  MembershipRepository,
} from "../ports/membership-repository";

export interface RemoveMemberInput {
  actorUserId: string;
  companyId: string;
  userId: string;
}

export class RemoveMember {
  constructor(
    private readonly memberships: MembershipRepository
  ) {}

  async execute(input: RemoveMemberInput) {
    const companyId = CompanyId.from(input.companyId);
    const actorId = UserId.from(input.actorUserId);
    const targetId = UserId.from(input.userId);

    // 1. Check the actor's membership
    const actor =
      await this.memberships.byUserAndCompany(
        actorId,
        companyId
      );

    // 2. Only owners can remove members
    if (!actor || actor.role !== "owner") {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "Only owners can remove members"
      );
    }

    // 3. Find the target membership
    const target =
      await this.memberships.byUserAndCompany(
        targetId,
        companyId
      );

    if (!target) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        "Membership not found"
      );
    }

    // 4. Protect owners from removal
    if (target.role === "owner") {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "Owners cannot be removed"
      );
    }

    // 5. Remove the membership
    await this.memberships.remove(
      targetId,
      companyId
    );

    return {
      userId: input.userId,
      companyId: input.companyId,
    };
  }
}
