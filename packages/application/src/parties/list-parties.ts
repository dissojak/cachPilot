import { authorize } from "../access/authorize";
import { CompanyId } from "@cashpilot/domain";
import type { PartyRepository } from "../ports/party-repository";
import type { MembershipRepository } from "../ports/membership-repository";

export interface ListPartiesInput {
  userId: string;
  companyId: string;
  type?: "customer" | "supplier";
}

export class ListParties {
  constructor(
    private readonly parties: PartyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: ListPartiesInput) {
    await authorize(this.memberships, input, "parties.view");

    const items = await this.parties.byCompany(CompanyId.from(input.companyId));
    return input.type ? items.filter((item) => item.type === input.type).map((item) => item.snapshot()) : items.map((item) => item.snapshot());
  }
}
