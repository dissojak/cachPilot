import { Money, DateOnly } from "@cashpilot/domain";
import type { RetainerRepository } from "../ports/retainer-repository";
import type { MembershipRepository } from "../ports/membership-repository";
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
  constructor(private readonly retainers: RetainerRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: UpdateRetainerInput) {
    await authorize(this.memberships, input, "retainers.manage");
    const retainer = await loadRetainer(this.retainers, input.companyId, input.retainerId);
    retainer.update({
      name: input.name,
      amount: input.amountMillimes !== undefined ? Money.positive(input.amountMillimes) : undefined,
      intervalDays: input.intervalDays,
      nextGenerationDate: input.nextGenerationDate ? DateOnly.from(input.nextGenerationDate) : undefined,
    });
    await this.retainers.save(retainer);
    return retainer.snapshot();
  }
}
