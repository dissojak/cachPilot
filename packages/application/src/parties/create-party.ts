import { CompanyId, UserId, Party } from "@cashpilot/domain";
import { PartyRepository } from "../ports/party-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

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
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

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
