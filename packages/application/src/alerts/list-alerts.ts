import { CompanyId, UserId, DateOnly } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { ExpenseRepository } from "../ports/expense-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { CompanyRepository } from "../ports/company-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { Clock } from "../ports/clock";
import { GetForecast } from "../forecast/get-forecast";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface Alert { type: string; entityType: string; entityId: string; message: string; }

export interface ListAlertsInput { userId: string; companyId: string; }

export class ListAlerts {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly expenses: ExpenseRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
    private readonly getForecast: GetForecast,
  ) {}

  async execute(input: ListAlertsInput): Promise<Alert[]> {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    const today = this.clock.today();
    const alerts: Alert[] = [];

    const invoices = await this.invoices.byCompany(CompanyId.from(input.companyId));
    for (const invoice of invoices) {
      if ((invoice.status === "validated" || invoice.status === "partially_paid") && invoice.remaining.amount > 0 && invoice.dueDate.isBefore(today)) {
        alerts.push({ type: "invoice_overdue", entityType: "invoice", entityId: invoice.id.value, message: `Invoice ${invoice.number.value} is overdue` });
      }
    }

    const expenses = await this.expenses.byCompany(CompanyId.from(input.companyId));
    for (const expense of expenses) {
      if (expense.status === "submitted") {
        alerts.push({ type: "expense_pending_approval", entityType: "expense", entityId: expense.id.value, message: `Expense ${expense.snapshot().description} is waiting for approval` });
      }
    }

    const forecast = await this.getForecast.execute({ userId: input.userId, companyId: input.companyId });
    for (const point of forecast.points) {
      if (point.balanceMillimes < 0) {
        alerts.push({ type: "negative_forecast", entityType: "forecast", entityId: input.companyId, message: `Forecast balance is negative on ${point.date}` });
      }
    }

    return alerts;
  }
}
