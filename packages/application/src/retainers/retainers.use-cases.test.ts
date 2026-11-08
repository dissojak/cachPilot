import { describe, it, expect } from "vitest";
import { Company, User, Membership, Party, Money, DateOnly } from "@cashpilot/domain";
import { CreateRetainer, GenerateRetainerInvoices, ListRetainers } from "./index";
import {
  InMemoryCompanyRepository,
  InMemoryUserRepository,
  InMemoryMembershipRepository,
  InMemoryPartyRepository,
  InMemoryInvoiceRepository,
  InMemoryRetainerRepository,
} from "../test/fakes";

describe("retainer use cases", () => {
  async function setup() {
    const companies = new InMemoryCompanyRepository();
    const users = new InMemoryUserRepository();
    const memberships = new InMemoryMembershipRepository();
    const parties = new InMemoryPartyRepository();
    const invoices = new InMemoryInvoiceRepository();
    const retainers = new InMemoryRetainerRepository();

    const company = Company.create({ name: "Atlas", sector: "agency", openingBalance: Money.of(5000000) });
    await companies.save(company);
    const user = User.fromOAuth({ email: "owner@demo.test", name: "Owner", provider: "demo", subject: "owner" });
    await users.save(user);
    await memberships.save(Membership.create(user.id, company.id, "owner"));
    const party = Party.create({ companyId: company.id, type: "customer", name: "Acme" });
    await parties.save(party);

    const retainer = await new CreateRetainer(retainers, memberships).execute({
      userId: user.id.value,
      companyId: company.id.value,
      customerId: party.id.value,
      name: "Monthly retainer",
      amountMillimes: 1000000,
      intervalDays: 30,
      nextGenerationDate: "2026-11-01",
    });

    return { company, user, parties, invoices, retainers, memberships, retainer };
  }

  it("generates due retainer invoices", async () => {
    const ctx = await setup();
    const result = await new GenerateRetainerInvoices(ctx.retainers, ctx.invoices, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
      asOfDate: "2026-11-30",
    });

    expect(result.generatedInvoiceIds).toHaveLength(1);
    const listed = await new ListRetainers(ctx.retainers, ctx.memberships).execute({
      userId: ctx.user.id.value,
      companyId: ctx.company.id.value,
    });
    expect(listed).toHaveLength(1);
  });
});
