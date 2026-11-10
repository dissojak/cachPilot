import type { CompanyId } from "../value-objects/ids";
import type { UserId } from "../value-objects/ids";
import type { MembershipRole } from "../access/roles";
import type { Permission } from "../access/permissions";
import { can } from "../access/permissions";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type { MembershipRole } from "../access/roles";

export class Membership {
  private constructor(
    readonly userId: UserId,
    readonly companyId: CompanyId,
    private currentRole: MembershipRole,
  ) {}

  static create(userId: UserId, companyId: CompanyId, role: MembershipRole) {
    return new Membership(userId, companyId, role);
  }

  static restore(userId: UserId, companyId: CompanyId, role: MembershipRole) {
    return new Membership(userId, companyId, role);
  }

  get role() { return this.currentRole; }

  /** Role → permission check against the domain policy (UNDERSTANDING.md §3). */
  can(permission: Permission): boolean {
    return can(this.currentRole, permission);
  }

  changeRole(role: MembershipRole) {
    this.currentRole = role;
  }

  /**
   * A company must always keep at least one owner, otherwise nobody can
   * manage members or approve expenses again (P2-3).
   */
  static assertNotLastOwner(members: readonly Membership[], leavingUserId: UserId) {
    const otherOwners = members.filter((member) => member.role === "owner" && !member.userId.equals(leavingUserId));
    const leavingIsOwner = members.some((member) => member.role === "owner" && member.userId.equals(leavingUserId));
    if (leavingIsOwner && otherOwners.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.LAST_OWNER, "The company must keep at least one owner");
    }
  }
}
