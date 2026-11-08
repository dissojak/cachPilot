
import {
  Company,
  CompanyId,
  Membership,
  Money,
  UserId,
} from "@cashpilot/domain";
import type { TransactionManager } from "../ports";
import type {
  CompanyRepository,
  MembershipRepository,
  IdGenerator,
} from "../ports";

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
  private readonly ids?: IdGenerator,
  private readonly transactions?: TransactionManager,
) {}


async execute(
  input: RegisterCompanyInput
): Promise<{ companyId: string }> {
  const work = async () => {
    const company = Company.create({
      id: this.ids
        ? CompanyId.from(this.ids.newId())
        : undefined,
      name: input.name,
      sector: input.sector,
      openingBalance: Money.of(
        input.openingBalanceMillimes
      ),
    });

    await this.companies.save(company);

    const membership = Membership.create(
      UserId.from(input.ownerUserId),
      company.id,
      "owner"
    );

    await this.memberships.save(membership);

    return { companyId: company.id.value };
  };

  return this.transactions
    ? this.transactions.run(work)
    : work();
}

}
