import { CompanyId, UserId } from "@cashpilot/domain";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ListCashMovementsInput { userId: string; companyId: string; }

export class ListCashMovements {
  constructor(private readonly movements: CashMovementRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListCashMovementsInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    return (await this.movements.byCompany(CompanyId.from(input.companyId))).map((item) => item.snapshot());
  }
}
