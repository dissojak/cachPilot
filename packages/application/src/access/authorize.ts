import { CompanyId, UserId, DomainError, DOMAIN_ERROR_CODES, assertCan } from "@cashpilot/domain";
import type { Membership, Permission } from "@cashpilot/domain";
import type { MembershipRepository } from "../ports/membership-repository";

/** Who is acting, and for which company. Every use case input extends this. */
export interface ActorInput {
  userId: string;
  companyId: string;
}

/**
 * BR-01/BR-02: the actor must be a member of the company, and their role must
 * grant the permission. Permissions come from the domain policy (one map).
 */
export async function authorize(
  memberships: MembershipRepository,
  actor: ActorInput,
  permission: Permission,
): Promise<Membership> {
  const membership = await authorizeMember(memberships, actor);
  assertCan(membership.role, permission);
  return membership;
}

/** Membership only, for reads every role may do (company name, member list). */
export async function authorizeMember(memberships: MembershipRepository, actor: ActorInput): Promise<Membership> {
  const membership = await memberships.byUserAndCompany(UserId.from(actor.userId), CompanyId.from(actor.companyId));
  if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "You are not a member of this company");
  return membership;
}
