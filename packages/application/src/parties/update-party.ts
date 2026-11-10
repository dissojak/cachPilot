import { CompanyId, PartyId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { PartyRepository } from "../ports/party-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface UpdatePartyInput {
  userId: string;
  companyId: string;
  partyId: string;
  type?: "customer" | "supplier";
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export class UpdateParty {
  constructor(
    private readonly parties: PartyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: UpdatePartyInput) {
    await authorize(this.memberships, input, "parties.manage");
    const party = await this.parties.byId(PartyId.from(input.partyId));
    if (!party || !party.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.PARTY_NOT_FOUND, "Party not found");
    }
    party.update({ type: input.type, name: input.name, email: input.email, phone: input.phone, address: input.address });
    await this.parties.save(party);
    return party.snapshot();
  }
}
