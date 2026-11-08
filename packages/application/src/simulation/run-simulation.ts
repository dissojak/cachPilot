import { CompanyId, UserId, ScenarioId, DateOnly, Money, Invoice, Expense } from "@cashpilot/domain";
import { ScenarioRepository } from "../ports/scenario-repository";
import { InvoiceRepository } from "../ports/invoice-repository";
import { ExpenseRepository } from "../ports/expense-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { CompanyRepository } from "../ports/company-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { ForecastEngine, ExpectedReceipt, PlannedDisbursement } from "@cashpilot/domain";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface RunSimulationInput { userId: string; companyId: string; scenarioId: string; }

export class RunSimulation {
  constructor(
    private readonly scenarios: ScenarioRepository,
    private readonly companies: CompanyRepository,
    private readonly invoices: InvoiceRepository,
    private readonly expenses: ExpenseRepository,
    private readonly movements: CashMovementRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: RunSimulationInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const scenario = await this.scenarios.byId(ScenarioId.from(input.scenarioId));
    if (!scenario || !scenario.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, "Scenario not found");

    const company = await this.companies.byId(CompanyId.from(input.companyId));
    if (!company) throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Company not found");

    const movements = await this.movements.byCompany(CompanyId.from(input.companyId));
    const referenceBalance = Money.of(movements.reduce((sum, movement) => sum + movement.amountMillimes, company.snapshot().openingBalanceMillimes));

    const invoices = await this.invoices.byCompany(CompanyId.from(input.companyId));
    const expenses = await this.expenses.byCompany(CompanyId.from(input.companyId));

    const baseReceipts: ExpectedReceipt[] = invoices
      .filter((invoice) => invoice.status === "validated" || invoice.status === "partially_paid")
      .map((invoice) => ({ dueDate: invoice.dueDate, remaining: invoice.remaining }));
    const baseDisbursements: PlannedDisbursement[] = expenses
      .filter((expense) => expense.status === "approved")
      .map((expense) => ({ plannedDate: expense.expenseDate, amount: expense.amount }));

    const simulatedReceipts = baseReceipts.map((receipt) => ({ ...receipt }));
    const simulatedDisbursements = baseDisbursements.map((disbursement) => ({ ...disbursement }));

    for (const hypothesis of scenario.hypotheses) {
      if (hypothesis.type === "client_delay" && hypothesis.invoiceId && hypothesis.delayDays) {
        const receipt = simulatedReceipts.find((item) => item.dueDate.value === invoices.find((invoice) => invoice.id.value === hypothesis.invoiceId)?.dueDate.value);
        if (receipt) receipt.dueDate = receipt.dueDate.addDays(hypothesis.delayDays);
      }
      if (hypothesis.type === "new_expense" && hypothesis.amountMillimes && hypothesis.plannedDate) {
        simulatedDisbursements.push({ plannedDate: DateOnly.from(hypothesis.plannedDate), amount: Money.of(hypothesis.amountMillimes) });
      }
      if (hypothesis.type === "extra_income" && hypothesis.amountMillimes && hypothesis.expectedDate) {
        simulatedReceipts.push({ dueDate: DateOnly.from(hypothesis.expectedDate), remaining: Money.of(hypothesis.amountMillimes) });
      }
    }

    const engine = new ForecastEngine();
    const targets = [scenario.baseReferenceDate, scenario.baseReferenceDate.addDays(30), scenario.baseReferenceDate.addDays(60), scenario.baseReferenceDate.addDays(90)];
    const basePoints = targets.map((target) => ({ date: target.value, balanceMillimes: engine.forecast(referenceBalance, baseReceipts, baseDisbursements, target).amount }));
    const simulatedPoints = targets.map((target) => ({ date: target.value, balanceMillimes: engine.forecast(referenceBalance, simulatedReceipts, simulatedDisbursements, target).amount }));

    const comparison = basePoints.map((point, index) => ({
      date: point.date,
      baseMillimes: point.balanceMillimes,
      simulatedMillimes: simulatedPoints[index]!.balanceMillimes,
      deltaMillimes: simulatedPoints[index]!.balanceMillimes - point.balanceMillimes,
    }));

    const shortageWindows = simulatedPoints
      .filter((point) => point.balanceMillimes < 0)
      .map((point) => ({ date: point.date, balanceMillimes: point.balanceMillimes }));

    return {
      scenario: scenario.snapshot(),
      base: basePoints,
      simulated: simulatedPoints,
      comparison,
      shortageWindows,
    };
  }
}
