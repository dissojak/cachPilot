
import { describe, it, expect, beforeEach } from "vitest";

import {
  CompanyId,
  UserId,
  Membership,
  User,
} from "@cashpilot/domain";

import { InviteMember } from "./invite-member";
import { ChangeMemberRole } from "./change-member-role";
import { RemoveMember } from "./remove-member";

import {
  InMemoryMembershipRepository,
  InMemoryUserRepository,
} from "../test/fakes";

describe("Companies - Member Permissions", () => {
  let memberships: InMemoryMembershipRepository;
  let users: InMemoryUserRepository;

  const companyId = "company-1";
  const otherCompanyId = "company-2";

  const ownerId = "owner-1";
  const memberId = "member-1";
  const outsiderId = "outsider-1";

  beforeEach(async () => {
    memberships = new InMemoryMembershipRepository();
    users = new InMemoryUserRepository();

    await memberships.save(
      Membership.create(
        UserId.from(ownerId),
        CompanyId.from(companyId),
        "owner"
      )
    );

    await memberships.save(
      Membership.create(
        UserId.from(memberId),
        CompanyId.from(companyId),
        "collaborator"
      )
    );
  });

  // ----------------------------------
  // TEST 1 - CHANGE ROLE
  // ----------------------------------

  it("allows owner to change collaborator role", async () => {
    const useCase = new ChangeMemberRole(memberships);

    await useCase.execute({
      actorUserId: ownerId,
      companyId,
      userId: memberId,
      role: "finance_manager",
    });

    const member = await memberships.byUserAndCompany(
      UserId.from(memberId),
      CompanyId.from(companyId)
    );

    expect(member?.role).toBe("finance_manager");
  });

  // ----------------------------------
  // TEST 2 - PROTECT OWNER
  // ----------------------------------

  it("prevents changing owner role", async () => {
    const useCase = new ChangeMemberRole(memberships);

    await expect(
      useCase.execute({
        actorUserId: ownerId,
        companyId,
        userId: ownerId,
        role: "collaborator",
      })
    ).rejects.toThrow();

    const owner = await memberships.byUserAndCompany(
      UserId.from(ownerId),
      CompanyId.from(companyId)
    );

    expect(owner?.role).toBe("owner");
  });

  // ----------------------------------
  // TEST 3 - REMOVE MEMBER
  // ----------------------------------

  it("allows owner to remove collaborator", async () => {
    const useCase = new RemoveMember(memberships);

    await useCase.execute({
      actorUserId: ownerId,
      companyId,
      userId: memberId,
    });

    const member = await memberships.byUserAndCompany(
      UserId.from(memberId),
      CompanyId.from(companyId)
    );

    expect(member).toBeNull();
  });

  // ----------------------------------
  // TEST 4 - PROTECT OWNER REMOVAL
  // ----------------------------------

  it("prevents removing owner", async () => {
    const useCase = new RemoveMember(memberships);

    await expect(
      useCase.execute({
        actorUserId: ownerId,
        companyId,
        userId: ownerId,
      })
    ).rejects.toThrow();

    const owner = await memberships.byUserAndCompany(
      UserId.from(ownerId),
      CompanyId.from(companyId)
    );

    expect(owner?.role).toBe("owner");
  });

  // ----------------------------------
  // TEST 5 - COLLABORATOR PERMISSIONS
  // ----------------------------------

  it("prevents collaborator from removing members", async () => {
    const useCase = new RemoveMember(memberships);

    await expect(
      useCase.execute({
        actorUserId: memberId,
        companyId,
        userId: ownerId,
      })
    ).rejects.toThrow();
  });

  // ----------------------------------
  // TEST 6 - CROSS COMPANY ACCESS
  // ----------------------------------

  it("prevents access to another company's members", async () => {
    const useCase = new RemoveMember(memberships);

    await expect(
      useCase.execute({
        actorUserId: ownerId,
        companyId: otherCompanyId,
        userId: outsiderId,
      })
    ).rejects.toThrow();
  });

  // ----------------------------------
  // TEST 7 - DUPLICATE MEMBERSHIP
  // ----------------------------------

  it("prevents duplicate member creation", async () => {
    const user = User.fromOAuth({
      email: "member@example.com",
      name: "Member",
      provider: "google",
      subject: "google-member-1",
    });

    await users.save(user);

    await memberships.save(
      Membership.create(
        user.id,
        CompanyId.from(companyId),
        "collaborator"
      )
    );

    const useCase = new InviteMember(
      memberships,
      users
    );

    await expect(
      useCase.execute({
        actorUserId: ownerId,
        companyId,
        userId: user.id.value,
        role: "finance_manager",
      })
    ).rejects.toThrow();

    const existing = await memberships.byUserAndCompany(
      user.id,
      CompanyId.from(companyId)
    );

    expect(existing?.role).toBe("collaborator");
  });
});
