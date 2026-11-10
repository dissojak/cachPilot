import { Company, CompanyId, Membership, UserId, CashMovement, CashMovementId, Money } from "@cashpilot/domain";
import type { CompanyRepository } from "../ports/company-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { FinancialLedger } from "../ports/financial-ledger";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { IdGenerator } from "../ports/id-generator";
import type { Clock } from "../ports/clock";
import { realizedDate } from "../access/dates";

export interface RegisterCompanyInput {
  /** The signed-in user; becomes the owner. */
  userId: string;
  name: string;
  sector: string;
  openingBalanceMillimes: number;
  openingDate: string;
}

/** Defense scenario step 1: create a company with an opening balance. */
export class RegisterCompany {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
    private readonly ledger: FinancialLedger,
    private readonly audit: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterCompanyInput): Promise<{ companyId: string }> {
    const owner = UserId.from(input.userId);
    const openingDate = realizedDate(input.openingDate, this.clock);
    const company = Company.create({ id: CompanyId.from(this.ids.newId()), name: input.name, sector: input.sector });
    const opening = CashMovement.opening({
      id: CashMovementId.from(this.ids.newId()),
      companyId: company.id,
      actorId: owner,
      date: openingDate,
      amount: Money.of(input.openingBalanceMillimes),
    });

    await this.companies.save(company);
    await this.memberships.save(Membership.create(owner, company.id, "owner"));
    await this.ledger.recordMovement(opening);
    await this.audit.append({
      companyId: company.id.value, actorId: input.userId, entityType: "company", entityId: company.id.value,
      action: "company.registered", after: { ...company.snapshot(), openingBalanceMillimes: input.openingBalanceMillimes },
      at: this.clock.now().toISOString(),
    });
    return { companyId: company.id.value };
  }
}
