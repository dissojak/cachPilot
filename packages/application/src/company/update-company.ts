import { CompanyId, Money, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { CompanyRepository } from "../ports/company-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

/**
 * Name, sector and threshold live on the entity and are updated through its
 * behaviour methods. There is no opening-balance field: the initial cash is an
 * opening movement, corrections are adjustments (D2, P0-8).
 */
export interface UpdateCompanyInput {
  userId: string;
  companyId: string;
  name?: string;
  sector?: string;
  forecastThresholdMillimes?: number;
}

export class UpdateCompany {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateCompanyInput) {
    await authorize(this.memberships, input, "company.manage");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");

    const before = company.snapshot();
    if (input.name !== undefined) company.rename(input.name);
    if (input.sector !== undefined) company.changeSector(input.sector);
    if (input.forecastThresholdMillimes !== undefined) {
      company.setForecastThreshold(Money.of(input.forecastThresholdMillimes));
    }

    await this.companies.save(company);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "company", entityId: input.companyId,
      action: "company.updated", before, after: company.snapshot(), at: this.clock.now().toISOString(),
    });
    return company.snapshot();
  }
}
