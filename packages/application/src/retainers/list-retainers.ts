import { CompanyId, UserId } from "@cashpilot/domain";
import { RetainerRepository } from "../ports/retainer-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ListRetainersInput { userId: string; companyId: string; }

export class ListRetainers {
  constructor(private readonly retainers: RetainerRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListRetainersInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    return (await this.retainers.byCompany(CompanyId.from(input.companyId))).map((retainer) => retainer.snapshot());
  }
}
