import { CompanyId, UserId, CashMovement, CashMovementId, Money, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { CashMovementRepository } from "../ports/cash-movement-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { FinancialLedger } from "../ports/financial-ledger";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { IdGenerator } from "../ports/id-generator";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { realizedDate } from "../access/dates";

export interface SetOpeningBalanceInput { userId: string; companyId: string; amountMillimes: number; openingDate?: string; }

/**
 * D2: the opening balance is an "opening" cash movement, a company has at
 * most one. Later corrections go through adjustments (traceable, P0-8).
 */
export class SetOpeningBalance {
  constructor(
    private readonly movements: CashMovementRepository,
    private readonly ledger: FinancialLedger,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: SetOpeningBalanceInput) {
    await authorize(this.memberships, input, "cash.adjust");
    const companyId = CompanyId.from(input.companyId);
    const existing = (await this.movements.byCompany(companyId)).some((movement) => movement.type === "opening");
    if (existing) {
      throw new DomainError(DOMAIN_ERROR_CODES.OPENING_BALANCE_ALREADY_SET, "The opening balance is already set; record an adjustment instead");
    }
    const movement = CashMovement.opening({
      id: CashMovementId.from(this.ids.newId()),
      companyId,
      actorId: UserId.from(input.userId),
      date: input.openingDate ? realizedDate(input.openingDate, this.clock) : this.clock.today(),
      amount: Money.of(input.amountMillimes),
    });
    await this.ledger.recordMovement(movement);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "cash_movement", entityId: movement.id.value,
      action: "cash.opening_set", after: movement.snapshot(), at: this.clock.now().toISOString(),
    });
    return movement.snapshot();
  }
}
