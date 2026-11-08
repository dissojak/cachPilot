import { CompanyId, UserId, DateOnly, Money, Invoice, Expense } from "@cashpilot/domain";
import { CompanyRepository } from "../ports/company-repository";
import { InvoiceRepository } from "../ports/invoice-repository";
import { ExpenseRepository } from "../ports/expense-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { Clock } from "../ports/clock";
import { ForecastEngine, ExpectedReceipt, PlannedDisbursement } from "@cashpilot/domain";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface GetForecastInput { userId: string; companyId: string; }

export class GetForecast {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly invoices: InvoiceRepository,
    private readonly expenses: ExpenseRepository,
    private readonly movements: CashMovementRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetForecastInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");

    const referenceDate = this.clock.today();
    const movements = await this.movements.byCompany(CompanyId.from(input.companyId));
    const referenceBalance = Money.of(
      movements
        .filter((movement) => !movement.movementDate.isAfter(referenceDate))
        .reduce((sum, movement) => sum + movement.amountMillimes, company.snapshot().openingBalanceMillimes),
    );

    const invoices = await this.invoices.byCompany(CompanyId.from(input.companyId));
    const receipts: ExpectedReceipt[] = invoices
      .filter((invoice) => invoice.status === "validated" || invoice.status === "partially_paid")
      .map((invoice) => ({ dueDate: invoice.dueDate, remaining: invoice.remaining }));

    const expenses = await this.expenses.byCompany(CompanyId.from(input.companyId));
    const disbursements: PlannedDisbursement[] = expenses
      .filter((expense) => expense.status === "approved")
      .map((expense) => ({ plannedDate: expense.expenseDate, amount: expense.amount }));

    const engine = new ForecastEngine();
    const targets = [referenceDate, referenceDate.addDays(30), referenceDate.addDays(60), referenceDate.addDays(90)];
    const points = targets.map((targetDate) => ({
      date: targetDate.value,
      balanceMillimes: engine.forecast(referenceBalance, receipts, disbursements, targetDate).amount,
    }));

    return { referenceDate: referenceDate.value, referenceBalanceMillimes: referenceBalance.amount, points };
  }
}
