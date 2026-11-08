import { describe, it, expect } from "vitest";
import { RegisterCompany } from "./register-company";
import { GetCompany } from "./get-company";
import { UpdateCompany } from "./update-company";
import { InviteMember } from "./invite-member";
import { ChangeMemberRole } from "./change-member-role";
import { RemoveMember } from "./remove-member";
import { CompanyId, UserId } from "@cashpilot/domain";
import {
  InMemoryCompanyRepository,
  InMemoryMembershipRepository,
  InMemoryUserRepository,
} from "../test/fakes";
import { User } from "@cashpilot/domain";

describe("company use cases", () => {
  it("registers a company and owner membership", async () => {
    const companies = new InMemoryCompanyRepository();
    const memberships = new InMemoryMembershipRepository();
    const useCase = new RegisterCompany(companies, memberships);

    const result = await useCase.execute({
      ownerUserId: "user-1",
      name: "Atlas Studio",
      sector: "agency",
      openingBalanceMillimes: 5000000,
    });

    expect(result.companyId).toBeTruthy();
    const membership = await memberships.byUserAndCompany(
      (await import("@cashpilot/domain")).UserId.from("user-1"),
      (await import("@cashpilot/domain")).CompanyId.from(result.companyId),
    );
    expect(membership?.role).toBe("owner");
  });

  it("gets a company for a member", async () => {
    const companies = new InMemoryCompanyRepository();
    const memberships = new InMemoryMembershipRepository();
    const registered = await new RegisterCompany(companies, memberships).execute({
      ownerUserId: "user-1",
      name: "Atlas Studio",
      sector: "agency",
      openingBalanceMillimes: 5000000,
    });

    const company = await new GetCompany(companies, memberships).execute({
      userId: "user-1",
      companyId: registered.companyId,
    });

    expect(company.name).toBe("Atlas Studio");
  });

  it("updates a company as owner", async () => {
    const companies = new InMemoryCompanyRepository();
    const memberships = new InMemoryMembershipRepository();
    const registered = await new RegisterCompany(companies, memberships).execute({
      ownerUserId: "user-1",
      name: "Atlas Studio",
      sector: "agency",
      openingBalanceMillimes: 5000000,
    });

    const updated = await new UpdateCompany(companies, memberships).execute({
      userId: "user-1",
      companyId: registered.companyId,
      name: "Atlas Studio 2",
    });

    expect(updated.name).toBe("Atlas Studio 2");
  });

  it("invites, changes role, and removes a member", async () => {
    const companies = new InMemoryCompanyRepository();
    const memberships = new InMemoryMembershipRepository();
    const users = new InMemoryUserRepository();
    const registered = await new RegisterCompany(companies, memberships).execute({
      ownerUserId: "user-1",
      name: "Atlas Studio",
      sector: "agency",
      openingBalanceMillimes: 5000000,
    });
    
    const user = User.fromOAuth({
      email: "member@cashpilot.demo",
      name: "Member",
      provider: "google",
      subject: "subject-1",
    });
    await users.save(user);

    await new InviteMember(memberships, users).execute({
      actorUserId: "user-1",
      companyId: registered.companyId,
      userId: user.id.value,
      role: "collaborator",
    });

    await new ChangeMemberRole(memberships).execute({
      actorUserId: "user-1",
      companyId: registered.companyId,
      userId: user.id.value,
      role: "finance_manager",
    });

    await new RemoveMember(memberships).execute({
      actorUserId: "user-1",
      companyId: registered.companyId,
      userId: user.id.value,
    });

    const removed = await memberships.byUserAndCompany(user.id, (await import("@cashpilot/domain")).CompanyId.from(registered.companyId));
    expect(removed).toBeNull();
    
  });
});
