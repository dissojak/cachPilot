import { CompanyId, UserId, ScenarioId } from "@cashpilot/domain";
import { ScenarioRepository } from "../ports/scenario-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { CompanyRepository } from "../ports/company-repository";
import { InvoiceRepository } from "../ports/invoice-repository";
import { ExpenseRepository } from "../ports/expense-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { RunSimulation } from "./run-simulation";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface CompareScenariosInput { userId: string; companyId: string; baseScenarioId: string; simulatedScenarioId: string; }

export class CompareScenarios {
  constructor(
    private readonly scenarios: ScenarioRepository,
    private readonly companies: CompanyRepository,
    private readonly invoices: InvoiceRepository,
    private readonly expenses: ExpenseRepository,
    private readonly movements: CashMovementRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: CompareScenariosInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    const runner = new RunSimulation(this.scenarios, this.companies, this.invoices, this.expenses, this.movements, this.memberships);
    const base = await runner.execute({ userId: input.userId, companyId: input.companyId, scenarioId: input.baseScenarioId });
    const simulated = await runner.execute({ userId: input.userId, companyId: input.companyId, scenarioId: input.simulatedScenarioId });

    return { base, simulated };
  }
}
