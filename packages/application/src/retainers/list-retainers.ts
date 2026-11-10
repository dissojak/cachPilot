import { authorize } from "../access/authorize";
import { CompanyId } from "@cashpilot/domain";
import type { RetainerRepository } from "../ports/retainer-repository";
import type { MembershipRepository } from "../ports/membership-repository";

export interface ListRetainersInput { userId: string; companyId: string; }

export class ListRetainers {
  constructor(private readonly retainers: RetainerRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListRetainersInput) {
    await authorize(this.memberships, input, "retainers.manage");
    return (await this.retainers.byCompany(CompanyId.from(input.companyId))).map((retainer) => retainer.snapshot());
  }
}
