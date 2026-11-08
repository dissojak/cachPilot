import { CompanyId, UserId } from "@cashpilot/domain";
import { PartyRepository } from "../ports/party-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

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
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    const items = await this.parties.byCompany(CompanyId.from(input.companyId));
    return input.type ? items.filter((item) => item.type === input.type).map((item) => item.snapshot()) : items.map((item) => item.snapshot());
  }
}
