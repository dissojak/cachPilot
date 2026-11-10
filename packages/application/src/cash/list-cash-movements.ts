import { authorize } from "../access/authorize";
import { CompanyId } from "@cashpilot/domain";
import type { CashMovementRepository } from "../ports/cash-movement-repository";
import type { MembershipRepository } from "../ports/membership-repository";

export interface ListCashMovementsInput { userId: string; companyId: string; }

export class ListCashMovements {
  constructor(private readonly movements: CashMovementRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListCashMovementsInput) {
    await authorize(this.memberships, input, "cash.view");
    return (await this.movements.byCompany(CompanyId.from(input.companyId))).map((item) => item.snapshot());
  }
}
