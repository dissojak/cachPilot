import { CompanyId, UserId, CashMovement, DateOnly } from "@cashpilot/domain";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface RecordAdjustmentInput {
  userId: string;
  companyId: string;
  amountMillimes: number;
  movementDate: string;
  reason: string;
}

export class RecordAdjustment {
  constructor(private readonly movements: CashMovementRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: RecordAdjustmentInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const movement = CashMovement.create({
      companyId: CompanyId.from(input.companyId),
      type: "adjustment",
      amountMillimes: input.amountMillimes,
      movementDate: DateOnly.from(input.movementDate),
      sourceType: "adjustment",
      sourceId: crypto.randomUUID(),
      actorId: UserId.from(input.userId),
      reason: input.reason,
    });
    await this.movements.save(movement);
    return movement.snapshot();
  }
}
