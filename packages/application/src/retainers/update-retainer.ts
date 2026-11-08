import { CompanyId, UserId, PartyId, RetainerId, Retainer, Money, DateOnly } from "@cashpilot/domain";
import { RetainerRepository } from "../ports/retainer-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface UpdateRetainerInput {
  userId: string;
  companyId: string;
  retainerId: string;
  customerId?: string;
  name?: string;
  amountMillimes?: number;
  intervalDays?: number;
  nextGenerationDate?: string;
  status?: "active" | "paused";
}

export class UpdateRetainer {
  constructor(private readonly retainers: RetainerRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: UpdateRetainerInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const retainer = await this.retainers.byId(RetainerId.from(input.retainerId));
    if (!retainer || !retainer.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Retainer not found");

    const updated = Retainer.create({
      id: RetainerId.from(input.retainerId),
      companyId: CompanyId.from(input.companyId),
      customerId: PartyId.from(input.customerId ?? retainer.customerId.value),
      name: input.name ?? retainer.name,
      amount: Money.of(input.amountMillimes ?? retainer.amount.amount),
      intervalDays: input.intervalDays ?? retainer.intervalDays,
      nextGenerationDate: DateOnly.from(input.nextGenerationDate ?? retainer.nextGenerationDate.value),
      status: input.status ?? retainer.status,
    });
    await this.retainers.save(updated);
    return updated.snapshot();
  }
}
