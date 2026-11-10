import { describe, it, expect } from "vitest";
import { createWorld, createCompany } from "../test/world";

describe("company, members and sign-in", () => {
  it("defense step 1: registering a company makes the user owner and records the opening balance once", async () => {
    const world = createWorld("2026-11-01");
    const actor = await world.useCases.resolveActor.execute({ email: "Founder@Agency.tn", name: "Founder", provider: "google", subject: "g-1" });
    expect(actor.companyId).toBeNull();
    const { companyId } = await world.useCases.registerCompany.execute({
      userId: actor.userId, name: "Atlas", sector: "digital agency", openingBalanceMillimes: 5_000_000, openingDate: "2026-11-01",
    });
    const again = await world.useCases.resolveActor.execute({ email: "founder@agency.tn", name: "Founder", provider: "google", subject: "g-1" });
    expect(again).toMatchObject({ userId: actor.userId, companyId, role: "owner" });
    expect((await world.useCases.getRealBalance.execute({ userId: actor.userId, companyId })).balanceMillimes).toBe(5_000_000);
  });

  it("P0-5: signing in never adds anyone to an existing company", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    const stranger = await world.useCases.resolveActor.execute({
      email: "stranger@gmail.com", name: "Stranger", provider: "google", subject: "s", preferredCompanyId: company.companyId,
    });
    expect(stranger.companyId).toBeNull();
    expect(stranger.permissions).toEqual([]);
  });

  it("invites an existing user by e-mail and lists members", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    await world.useCases.resolveActor.execute({ email: "new@demo.test", name: "New", provider: "google", subject: "n" });
    await world.useCases.inviteMember.execute({ ...company.owner, email: "NEW@demo.test", role: "collaborator" });
    const members = await world.useCases.listMembers.execute(company.collaborator);
    expect(members.map((member) => member.email)).toContain("new@demo.test");
    await expect(world.useCases.inviteMember.execute({ ...company.owner, email: "nobody@demo.test", role: "collaborator" }))
      .rejects.toMatchObject({ code: "USER_NOT_FOUND" });
  });

  it("P2-3: the last owner cannot be demoted or removed", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    await expect(world.useCases.changeMemberRole.execute({ ...company.owner, memberUserId: company.owner.userId, role: "collaborator" }))
      .rejects.toMatchObject({ code: "LAST_OWNER" });
    await expect(world.useCases.removeMember.execute({ ...company.owner, memberUserId: company.owner.userId }))
      .rejects.toMatchObject({ code: "LAST_OWNER" });
    await world.useCases.changeMemberRole.execute({ ...company.owner, memberUserId: company.finance.userId, role: "owner" });
    await world.useCases.removeMember.execute({ ...company.finance, memberUserId: company.owner.userId });
    expect(await world.useCases.listMembers.execute(company.finance)).toHaveLength(2);
  });

  it("only the owner manages the company and its members", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    await expect(world.useCases.updateCompany.execute({ ...company.finance, name: "Hacked" })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(world.useCases.removeMember.execute({ ...company.finance, memberUserId: company.collaborator.userId }))
      .rejects.toMatchObject({ code: "ACCESS_DENIED" });
    const updated = await world.useCases.updateCompany.execute({ ...company.owner, name: "Atlas Studio SARL", forecastThresholdMillimes: 1_000_000 });
    expect(updated).toMatchObject({ name: "Atlas Studio SARL", forecastThresholdMillimes: 1_000_000 });
  });

  it("lists the companies a user belongs to", async () => {
    const world = createWorld();
    const company = await createCompany(world);
    expect(await world.useCases.listMyCompanies.execute({ userId: company.owner.userId })).toEqual([
      { companyId: company.companyId, name: "Atlas Studio", role: "owner" },
    ]);
  });
});
