import { CompanyId, UserId, Money } from "@cashpilot/domain";
import { Company } from "@cashpilot/domain";
import { CompanyRepository } from "../ports/company-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface UpdateCompanyInput {
  userId: string;
  companyId: string;
  name?: string;
  sector?: string;
  openingBalanceMillimes?: number;
  forecastThresholdMillimes?: number;
}

export class UpdateCompany {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: UpdateCompanyInput) {
    const membership = await this.memberships.byUserAndCompany(
      UserId.from(input.userId),
      CompanyId.from(input.companyId),
    );
    if (!membership || membership.role !== "owner") {
      throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Only the owner can update the company");
    }

    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) {
      throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    }

    const updated = Company.create({
      id: CompanyId.from(input.companyId),
      name: input.name ?? company.snapshot().name,
      sector: input.sector ?? company.snapshot().sector,
      openingBalance: Money.of(input.openingBalanceMillimes ?? company.snapshot().openingBalanceMillimes),
      forecastThreshold: Money.of(input.forecastThresholdMillimes ?? company.snapshot().forecastThresholdMillimes),
    });

    await this.companies.save(updated);
    return updated.snapshot();
  }
}
