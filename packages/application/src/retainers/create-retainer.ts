import { CompanyId, UserId, PartyId, Retainer, Money, DateOnly } from "@cashpilot/domain";
import { RetainerRepository } from "../ports/retainer-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

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
  constructor(private readonly retainers: RetainerRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: CreateRetainerInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const retainer = Retainer.create({
      companyId: CompanyId.from(input.companyId),
      customerId: PartyId.from(input.customerId),
      name: input.name,
      amount: Money.of(input.amountMillimes),
      intervalDays: input.intervalDays,
      nextGenerationDate: DateOnly.from(input.nextGenerationDate),
    });
    await this.retainers.save(retainer);
    return retainer.snapshot();
  }
}
