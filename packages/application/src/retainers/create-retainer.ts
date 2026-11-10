import { CompanyId, PartyId, Retainer, Money, DateOnly, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { RetainerRepository } from "../ports/retainer-repository";
import type { PartyRepository } from "../ports/party-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface CreateRetainerInput {
  userId: string;
  companyId: string;
  customerId: string;
  name: string;
  amountMillimes: number;
  intervalDays: number;
  nextGenerationDate: string;
}

export class CreateRetainer {
  constructor(
    private readonly retainers: RetainerRepository,
    private readonly parties: PartyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: CreateRetainerInput) {
    await authorize(this.memberships, input, "retainers.manage");
    const companyId = CompanyId.from(input.companyId);
    const customer = await this.parties.byId(PartyId.from(input.customerId));
    if (!customer || !customer.companyId.equals(companyId) || customer.type !== "customer") {
      throw new DomainError(DOMAIN_ERROR_CODES.PARTY_NOT_FOUND, "Customer not found");
    }
    const retainer = Retainer.create({
      companyId,
      customerId: customer.id,
      name: input.name,
      amount: Money.positive(input.amountMillimes),
      intervalDays: input.intervalDays,
      nextGenerationDate: DateOnly.from(input.nextGenerationDate),
    });
    await this.retainers.save(retainer);
    return retainer.snapshot();
  }
}
