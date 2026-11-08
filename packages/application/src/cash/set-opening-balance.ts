import { CompanyId, UserId, Money } from "@cashpilot/domain";
import { CompanyRepository } from "../ports/company-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface SetOpeningBalanceInput { userId: string; companyId: string; amountMillimes: number; }

export class SetOpeningBalance {
  constructor(private readonly companies: CompanyRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: SetOpeningBalanceInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership || membership.role !== "owner") throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Only the owner can set the opening balance");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    const updated = (await import("@cashpilot/domain")).Company.create({
      id: CompanyId.from(input.companyId),
      name: company.snapshot().name,
      sector: company.snapshot().sector,
      openingBalance: Money.of(input.amountMillimes),
      forecastThreshold: Money.of(company.snapshot().forecastThresholdMillimes),
    });
    await this.companies.save(updated);
    return updated.snapshot();
  }
}
