import { CompanyId, UserId } from "@cashpilot/domain";
import { CompanyRepository } from "../ports/company-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface GetRealBalanceInput { userId: string; companyId: string; }

export class GetRealBalance {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly movements: CashMovementRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: GetRealBalanceInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    const movements = await this.movements.byCompany(CompanyId.from(input.companyId));
    const balance = movements.reduce((sum, movement) => sum + movement.amountMillimes, company.snapshot().openingBalanceMillimes);
    return { companyId: input.companyId, balanceMillimes: balance };
  }
}
