import { describe, it, expect } from "vitest";
import { Company, User, Membership, Party, Invoice, Expense, Money, DateOnly, InvoiceNumber } from "@cashpilot/domain";
import { CreateScenario, AddHypothesis, RunSimulation } from "./index";
import {
  InMemoryCompanyRepository,
  InMemoryUserRepository,
  InMemoryMembershipRepository,
  InMemoryPartyRepository,
  InMemoryInvoiceRepository,
  InMemoryExpenseRepository,
  InMemoryCashMovementRepository,
  InMemoryScenarioRepository,
} from "../test/fakes";

describe("simulation use cases", () => {
  async function setup() {
    const companies = new InMemoryCompanyRepository();
    const users = new InMemoryUserRepository();
    const memberships = new InMemoryMembershipRepository();
    const parties = new InMemoryPartyRepository();
    const invoices = new InMemoryInvoiceRepository();
    const expenses = new InMemoryExpenseRepository();
    const movements = new InMemoryCashMovementRepository();
    const scenarios = new InMemoryScenarioRepository();

    const company = Company.create({ name: "Atlas", sector: "agency", openingBalance: Money.of(5000000) });
    await companies.save(company);
    const user = User.fromOAuth({ email: "owner@demo.test", name: "Owner", provider: "demo", subject: "owner" });
    await users.save(user);
    await memberships.save(Membership.create(user.id, company.id, "owner"));
    const party = Party.create({ companyId: company.id, type: "customer", name: "Acme" });
    await parties.save(party);

    const invoice = Invoice.create({
      companyId: company.id,
      customerId: party.id,
      number: InvoiceNumber.from("INV-001"),
      issueDate: DateOnly.from("2026-11-01"),
      dueDate: DateOnly.from("2026-11-10"),
      lines: [{ description: "Work", quantity: 1, unitPrice: Money.of(3000000), lineTotal: Money.of(3000000) }],
    });
    invoice.validate();
    await invoices.save(invoice);

    const expense = Expense.create({
      companyId: company.id,
      submittedBy: user.id,
      category: "Rent",
      description: "Rent",
      amount: Money.of(6000000),
      expenseDate: DateOnly.from("2026-11-15"),
    });
    expense.approve(user.id, DateOnly.from("2026-11-02"));
    await expenses.save(expense);

    return { company, user, companies, invoices, expenses, movements, scenarios, memberships, invoice };
  }

  it("runs a simulation without mutating real data", async () => {
    const ctx = await setup();
    const scenario = await new CreateScenario(ctx.scenarios, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      name: "Late payment",
      baseReferenceDate: "2026-11-10",
    });
    await new AddHypothesis(ctx.scenarios, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      scenarioId: scenario.id,
      hypothesis: { type: "client_delay", invoiceId: ctx.invoice.id.value, delayDays: 20 },
    });

    const originalDueDate = (await ctx.invoices.byId(ctx.invoice.id))!.dueDate.value;
    const result = await new RunSimulation(ctx.scenarios, ctx.companies, ctx.invoices, ctx.expenses, ctx.movements, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      scenarioId: scenario.id,
    });

    expect(result.base).toHaveLength(4);
    expect(result.simulated).toHaveLength(4);
    expect((await ctx.invoices.byId(ctx.invoice.id))!.dueDate.value).toBe(originalDueDate);
  });
});
