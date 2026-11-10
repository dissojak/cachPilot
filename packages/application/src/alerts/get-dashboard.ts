import { CompanyId, AlertEvaluator, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { CompanyRepository } from "../ports/company-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { describeForecast, seriesOf } from "../forecast/forecast-context";
import type { ForecastContextLoader } from "../forecast/forecast-context";

export interface GetDashboardInput { userId: string; companyId: string; }

/** M10: real balance, 30/60/90 projection, alerts — loaded once, computed by the domain. */
export class GetDashboard {
  constructor(
    private readonly loader: ForecastContextLoader,
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetDashboardInput) {
    await authorize(this.memberships, input, "dashboard.view");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");
    const today = this.clock.today();
    const context = await this.loader.load(input.companyId, today);
    const alerts = new AlertEvaluator().evaluate({
      today,
      invoices: context.invoices,
      expenses: context.expenses,
      series: seriesOf(context.inputs),
      threshold: company.forecastThreshold,
    });

    return {
      company: company.snapshot(),
      realBalanceMillimes: context.inputs.referenceBalance.amount,
      forecast: describeForecast(context.inputs),
      alerts,
      counts: {
        openInvoices: context.invoices.filter((invoice) => invoice.expectedReceipt() !== null).length,
        overdueInvoices: context.invoices.filter((invoice) => invoice.isOverdue(today)).length,
        pendingExpenses: context.expenses.filter((expense) => expense.status === "submitted").length,
        alerts: alerts.length,
      },
    };
  }
}
