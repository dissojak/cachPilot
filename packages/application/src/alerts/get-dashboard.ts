import { CompanyId, UserId } from "@cashpilot/domain";
import { CompanyRepository } from "../ports/company-repository";
import { InvoiceRepository } from "../ports/invoice-repository";
import { ExpenseRepository } from "../ports/expense-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { Clock } from "../ports/clock";
import { GetForecast } from "../forecast/get-forecast";
import { ListAlerts } from "./list-alerts";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface GetDashboardInput { userId: string; companyId: string; }

export class GetDashboard {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly invoices: InvoiceRepository,
    private readonly expenses: ExpenseRepository,
    private readonly memberships: MembershipRepository,
    private readonly movements: CashMovementRepository,
    private readonly clock: Clock,
    private readonly getForecast: GetForecast,
    private readonly listAlerts: ListAlerts,
  ) {}

  async execute(input: GetDashboardInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");

    const movements = await this.movements.byCompany(CompanyId.from(input.companyId));
    const realBalanceMillimes = movements.reduce((sum, movement) => sum + movement.amountMillimes, company.snapshot().openingBalanceMillimes);
    const forecast = await this.getForecast.execute(input);
    const alerts = await this.listAlerts.execute(input);

    return {
      company: company.snapshot(),
      realBalanceMillimes,
      forecast,
      alerts,
      counts: {
        invoices: (await this.invoices.byCompany(CompanyId.from(input.companyId))).length,
        expenses: (await this.expenses.byCompany(CompanyId.from(input.companyId))).length,
        alerts: alerts.length,
      },
    };
  }
}
