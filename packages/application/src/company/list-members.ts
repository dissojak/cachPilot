import { CompanyId } from "@cashpilot/domain";
import type { MembershipRepository } from "../ports/membership-repository";
import type { UserRepository } from "../ports/user-repository";
import { authorizeMember } from "../access/authorize";

export interface ListMembersInput { userId: string; companyId: string; }

export class ListMembers {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(input: ListMembersInput) {
    await authorizeMember(this.memberships, input);
    const members = await this.memberships.listByCompany(CompanyId.from(input.companyId));
    return Promise.all(members.map(async (member) => {
      const user = await this.users.byId(member.userId);
      return {
        userId: member.userId.value,
        name: user?.name ?? member.userId.value,
        email: user?.email ?? "",
        role: member.role,
      };
    }));
  }
}
