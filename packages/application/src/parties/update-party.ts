import { CompanyId, UserId, PartyId, Party } from "@cashpilot/domain";
import { PartyRepository } from "../ports/party-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

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
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    const party = await this.parties.byId(PartyId.from(input.partyId));
    if (!party || !party.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Party not found");
    }

    const updated = Party.create({
      id: PartyId.from(input.partyId),
      companyId: CompanyId.from(input.companyId),
      type: input.type ?? party.type,
      name: input.name ?? party.name,
      email: input.email ?? party.snapshot().email,
      phone: input.phone ?? party.snapshot().phone,
      address: input.address ?? party.snapshot().address,
    });
    await this.parties.save(updated);
    return updated.snapshot();
  }
}
