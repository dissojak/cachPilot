import { Company } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";
import { Membership } from "@cashpilot/domain";
import { Money } from "@cashpilot/domain";
import { CompanyRepository } from "../ports/company-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { UserId } from "@cashpilot/domain";

export interface RegisterCompanyInput {
  ownerUserId: string;
  name: string;
  sector: string;
  openingBalanceMillimes: number;
}

export class RegisterCompany {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: RegisterCompanyInput): Promise<{ companyId: string }> {
    const company = Company.create({
      name: input.name,
      sector: input.sector,
      openingBalance: Money.of(input.openingBalanceMillimes),
    });
    await this.companies.save(company);

    const membership = Membership.create(
      UserId.from(input.ownerUserId),
      company.id,
      "owner",
    );
    await this.memberships.save(membership);

    return { companyId: company.id.value };
  }
}
