import { CompanyId, UserId, RetainerId } from "@cashpilot/domain";
import { RetainerRepository } from "../ports/retainer-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ResumeRetainerInput { userId: string; companyId: string; retainerId: string; }

export class ResumeRetainer {
  constructor(private readonly retainers: RetainerRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ResumeRetainerInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const retainer = await this.retainers.byId(RetainerId.from(input.retainerId));
    if (!retainer || !retainer.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Retainer not found");
    retainer.resume();
    await this.retainers.save(retainer);
    return retainer.snapshot();
  }
}
