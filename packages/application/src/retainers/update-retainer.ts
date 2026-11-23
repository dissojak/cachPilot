import { Money, DateOnly } from "@cashpilot/domain";
import type { RetainerRepository } from "../ports/retainer-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { loadRetainer } from "./load-retainer";

export interface UpdateRetainerInput {
  userId: string;
  companyId: string;
  retainerId: string;
  name?: string;
  amountMillimes?: number;
  intervalDays?: number;
  nextGenerationDate?: string;
}

export class UpdateRetainer {
  constructor(
    private readonly retainers: RetainerRepository,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}
  async execute(input: UpdateRetainerInput) {
    await authorize(this.memberships, input, "retainers.manage");
    const retainer = await loadRetainer(this.retainers, input.companyId, input.retainerId);
    const before = retainer.snapshot();
    retainer.update({
      name: input.name,
      amount: input.amountMillimes !== undefined ? Money.positive(input.amountMillimes) : undefined,
      intervalDays: input.intervalDays,
      nextGenerationDate: input.nextGenerationDate ? DateOnly.from(input.nextGenerationDate) : undefined,
    });
    await this.retainers.save(retainer);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "retainer", entityId: input.retainerId,
      action: "retainer.updated", before, after: retainer.snapshot(), at: this.clock.now().toISOString(),
    });
    return retainer.snapshot();
  }
}
