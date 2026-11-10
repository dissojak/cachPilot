import { authorize } from "../access/authorize";
import { CompanyId, CashBalanceCalculator } from "@cashpilot/domain";
import type { CompanyRepository } from "../ports/company-repository";
import type { CashMovementRepository } from "../ports/cash-movement-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface GetRealBalanceInput { userId: string; companyId: string; }

export class GetRealBalance {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly movements: CashMovementRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetRealBalanceInput) {
    await authorize(this.memberships, input, "cash.view");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    const movements = await this.movements.byCompany(CompanyId.from(input.companyId));
    const balance = new CashBalanceCalculator().balanceAt(movements, this.clock.today());
    return { companyId: input.companyId, balanceMillimes: balance.amount };
  }
}
