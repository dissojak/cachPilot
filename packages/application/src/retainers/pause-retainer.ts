import type { RetainerRepository } from "../ports/retainer-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";
import { loadRetainer } from "./load-retainer";

export interface PauseRetainerInput { userId: string; companyId: string; retainerId: string; }

export class PauseRetainer {
  constructor(private readonly retainers: RetainerRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: PauseRetainerInput) {
    await authorize(this.memberships, input, "retainers.manage");
    const retainer = await loadRetainer(this.retainers, input.companyId, input.retainerId);
    retainer.pause();
    await this.retainers.save(retainer);
    return retainer.snapshot();
  }
}
