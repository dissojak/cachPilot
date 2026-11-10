import { authorize } from "../access/authorize";
import { CompanyId, Party } from "@cashpilot/domain";
import type { PartyRepository } from "../ports/party-repository";
import type { MembershipRepository } from "../ports/membership-repository";

export interface CreatePartyInput {
  userId: string;
  companyId: string;
  type: "customer" | "supplier";
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export class CreateParty {
  constructor(
    private readonly parties: PartyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: CreatePartyInput) {
    await authorize(this.memberships, input, "parties.manage");

    const party = Party.create({
      companyId: CompanyId.from(input.companyId),
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
    });
    await this.parties.save(party);
    return party.snapshot();
  }
}
