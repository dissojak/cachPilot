import { UserId } from "@cashpilot/domain";
import type { MembershipRepository } from "../ports/membership-repository";
import type { CompanyRepository } from "../ports/company-repository";

export interface ListMyCompaniesInput { userId: string; }

/** Companies the user belongs to, for the company switcher. */
export class ListMyCompanies {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly companies: CompanyRepository,
  ) {}

  async execute(input: ListMyCompaniesInput) {
    const memberships = await this.memberships.listByUser(UserId.from(input.userId));
    const rows = await Promise.all(memberships.map(async (membership) => {
      const company = await this.companies.byId(membership.companyId);
      return company ? { companyId: company.id.value, name: company.name, role: membership.role } : null;
    }));
    return rows.filter((row) => row !== null);
  }
}
