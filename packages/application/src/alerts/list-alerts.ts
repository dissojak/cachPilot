import { CompanyId, AlertEvaluator, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { Alert } from "@cashpilot/domain";
import type { CompanyRepository } from "../ports/company-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { seriesOf } from "../forecast/forecast-context";
import type { ForecastContextLoader } from "../forecast/forecast-context";

export interface ListAlertsInput { userId: string; companyId: string; }

/** M10 / BR-28: overdue invoices, expenses to approve, negative or low forecast. */
export class ListAlerts {
  constructor(
    private readonly loader: ForecastContextLoader,
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListAlertsInput): Promise<Alert[]> {
    await authorize(this.memberships, input, "dashboard.view");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    const today = this.clock.today();
    const context = await this.loader.load(input.companyId, today);
    return new AlertEvaluator().evaluate({
      today,
      invoices: context.invoices,
      expenses: context.expenses,
      series: seriesOf(context.inputs),
      threshold: company.forecastThreshold,
    });
  }
}
