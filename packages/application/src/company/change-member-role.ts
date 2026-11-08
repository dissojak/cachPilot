
import {
  CompanyId,
  UserId,
  Membership,
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import type {
  MembershipRepository,
} from "../ports/membership-repository";

export interface ChangeMemberRoleInput {
  actorUserId: string;
  companyId: string;
  userId: string;
  role: "finance_manager" | "collaborator";
}

export class ChangeMemberRole {
  constructor(
    private readonly memberships: MembershipRepository
  ) {}

  async execute(input: ChangeMemberRoleInput) {
    const companyId = CompanyId.from(input.companyId);
    const actorId = UserId.from(input.actorUserId);
    const targetId = UserId.from(input.userId);

    // 1. Verify that the actor is an owner
    const actor =
      await this.memberships.byUserAndCompany(
        actorId,
        companyId
      );

    if (!actor || actor.role !== "owner") {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "Only owners can change member roles"
      );
    }

    // 2. Find the target member
    const membership =
      await this.memberships.byUserAndCompany(
        targetId,
        companyId
      );

    if (!membership) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.USER_NOT_FOUND,
        "Membership not found"
      );
    }

    // 3. Protect existing owners
    if (membership.role === "owner") {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "Owner role cannot be changed"
      );
    }

    // 4. Reject unchanged roles
    if (membership.role === input.role) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.DUPLICATE_OPERATION,
        "Member already has this role"
      );
    }

    // 5. Create the updated membership
    const updated = Membership.create(
      targetId,
      companyId,
      input.role
    );

    // 6. Save to the repository
    await this.memberships.save(updated);

    return {
      userId: input.userId,
      companyId: input.companyId,
      role: input.role,
    };
  }
}