import { CompanyId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { CompanyRepository } from "../ports/company-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorizeMember } from "../access/authorize";

export interface GetCompanyInput {
  userId: string;
  companyId: string;
}

export class GetCompany {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: GetCompanyInput) {
    await authorizeMember(this.memberships, input);
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    return company.snapshot();
  }
}
