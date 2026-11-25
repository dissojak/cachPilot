import { CompanyId, UserId, CashMovement, CashMovementId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { CashMovementRepository } from "../ports/cash-movement-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { FinancialLedger } from "../ports/financial-ledger";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface ReverseMovementInput {
  userId: string;
  companyId: string;
  movementId: string;
  reason: string;
}

/**
 * BR-19: a wrong manual adjustment is corrected by a new movement that cancels
 * it, linked to the original, with a reason. Nothing is edited or deleted.
 * The rules (what can be reversed, only once) live in CashMovement.reversal.
 */
export class ReverseMovement {
  constructor(
    private readonly movements: CashMovementRepository,
    private readonly ledger: FinancialLedger,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ReverseMovementInput) {
    await authorize(this.memberships, input, "cash.adjust");
    const companyId = CompanyId.from(input.companyId);
    const original = await this.movements.byId(CashMovementId.from(input.movementId));
    // another company's movement looks "not found": tenant isolation
    if (!original || !original.companyId.equals(companyId)) {
      throw new DomainError(DOMAIN_ERROR_CODES.MOVEMENT_NOT_FOUND, "Cash movement not found");
    }

    const alreadyReversed = (await this.movements.byCompany(companyId)).some((item) => item.reversesId?.equals(original.id));
    const reversal = CashMovement.reversal({
      // One reversal per movement by construction: the id is derived from the original,
      // so a double click or two simultaneous requests hit the ledger's duplicate-id check.
      id: CashMovementId.from(`reversal-${original.id.value}`),
      original,
      actorId: UserId.from(input.userId),
      date: this.clock.today(),
      reason: input.reason,
      alreadyReversed,
    });

    await this.ledger.recordMovement(reversal);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "cash_movement", entityId: reversal.id.value,
      action: "cash.reversed", before: original.snapshot(), after: reversal.snapshot(), reason: input.reason,
      at: this.clock.now().toISOString(),
    });
    return reversal.snapshot();
  }
}
