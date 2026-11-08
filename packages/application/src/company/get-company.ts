import { CompanyId, UserId } from "@cashpilot/domain";
import { CompanyRepository } from "../ports/company-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

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
    const membership = await this.memberships.byUserAndCompany(
      UserId.from(input.userId),
      CompanyId.from(input.companyId),
    );
    if (!membership) {
      throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    }

    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) {
      throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    }

    return company.snapshot();
  }
}
