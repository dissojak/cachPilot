import { UserId } from "../value-objects/ids";
import { CompanyId } from "../value-objects/ids";

export type MembershipRole = "owner" | "finance_manager" | "collaborator";

export class Membership {
  private constructor(
    readonly userId: UserId,
    readonly companyId: CompanyId,
    readonly role: MembershipRole,
  ) {}

  static create(userId: UserId, companyId: CompanyId, role: MembershipRole) {
    return new Membership(userId, companyId, role);
  }

  static restore(userId: UserId, companyId: CompanyId, role: MembershipRole) {
    return new Membership(userId, companyId, role);
  }
}
