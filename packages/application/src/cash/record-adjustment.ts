import { CompanyId, UserId, CashMovement, CashMovementId, Money } from "@cashpilot/domain";
import type { MembershipRepository } from "../ports/membership-repository";
import type { FinancialLedger } from "../ports/financial-ledger";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { IdGenerator } from "../ports/id-generator";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { realizedDate } from "../access/dates";

export interface RecordAdjustmentInput {
  userId: string;
  companyId: string;
  /** Signed: positive adds cash, negative removes it. Never zero. */
  amountMillimes: number;
  movementDate: string;
  reason: string;
}

/** BR-19: a correction is a new, traceable movement with a reason; nothing is edited. */
export class RecordAdjustment {
  constructor(
    private readonly ledger: FinancialLedger,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RecordAdjustmentInput) {
    await authorize(this.memberships, input, "cash.adjust");
    const movement = CashMovement.adjustment({
      id: CashMovementId.from(this.ids.newId()),
      companyId: CompanyId.from(input.companyId),
      actorId: UserId.from(input.userId),
      date: realizedDate(input.movementDate, this.clock),
      amount: Money.of(input.amountMillimes),
      reason: input.reason,
    });
    await this.ledger.recordMovement(movement);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "cash_movement", entityId: movement.id.value,
      action: "cash.adjusted", after: movement.snapshot(), reason: input.reason, at: this.clock.now().toISOString(),
    });
    return movement.snapshot();
  }
}
