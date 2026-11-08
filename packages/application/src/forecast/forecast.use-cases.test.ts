import { describe, it, expect } from "vitest";
import { Company, User, Membership, Party, Invoice, Expense, Money, DateOnly, InvoiceNumber } from "@cashpilot/domain";
import { GetForecast } from "./get-forecast";
import {
  InMemoryCompanyRepository,
  InMemoryUserRepository,
  InMemoryMembershipRepository,
  InMemoryPartyRepository,
  InMemoryInvoiceRepository,
  InMemoryExpenseRepository,
  InMemoryCashMovementRepository,
} from "../test/fakes";
class FakeClock {
  today() { return DateOnly.from("2026-11-08"); }
  now() { return new Date("2026-11-08T00:00:00.000Z"); }
}

describe("forecast use cases", () => {
  async function setup() {
    const companies = new InMemoryCompanyRepository();
    const users = new InMemoryUserRepository();
    const memberships = new InMemoryMembershipRepository();
    const parties = new InMemoryPartyRepository();
    const invoices = new InMemoryInvoiceRepository();
    const expenses = new InMemoryExpenseRepository();
    const movements = new InMemoryCashMovementRepository();

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

    return { company, user, companies, invoices, expenses, movements, memberships };
  }

  it("calculates forecast points", async () => {
    const ctx = await setup();
    const forecast = await new GetForecast(ctx.companies, ctx.invoices, ctx.expenses, ctx.movements, ctx.memberships, new FakeClock() as any).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
    });

    expect(forecast.points).toHaveLength(4);
    expect(forecast.points[0]!.balanceMillimes).toBe(5000000);
  });
});
