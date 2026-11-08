
import { describe, it, expect } from "vitest";
import { CompanyId, UserId, Membership } from "@cashpilot/domain";
import { RegisterCompany } from "./register-company";

import {
  InMemoryCompanyRepository,
  InMemoryMembershipRepository,
} from "../test/fakes";

describe("RegisterCompany - ID Generator", () => {
  it("uses an injected company ID", async () => {
    const companies =
      new InMemoryCompanyRepository();

    const memberships =
      new InMemoryMembershipRepository();

    const ids = {
      newId: () => "507f1f77bcf86cd799439011",
    };

    const useCase = new RegisterCompany(
      companies,
      memberships,
      ids
    );

    const result = await useCase.execute({
      ownerUserId: "user-1",
      name: "CashPilot Test",
      sector: "digital agency",
      openingBalanceMillimes: 5000000,
    });

    expect(result.companyId).toBe(
      "507f1f77bcf86cd799439011"
    );

    const company = await companies.byId(
      CompanyId.from(result.companyId)
    );

    expect(company?.name).toBe("CashPilot Test");

    const membership =
      await memberships.byUserAndCompany(
        UserId.from("user-1"),
        CompanyId.from(result.companyId)
      );

    expect(membership?.role).toBe("owner");
  });
});

it("lists memberships belonging to a user", async () => {
  const memberships =
    new InMemoryMembershipRepository();

  const userId = UserId.from("user-1");

  await memberships.save(
    Membership.create(
      userId,
      CompanyId.from("company-1"),
      "owner"
    )
  );

  await memberships.save(
    Membership.create(
      userId,
      CompanyId.from("company-2"),
      "collaborator"
    )
  );

  await memberships.save(
    Membership.create(
      UserId.from("user-2"),
      CompanyId.from("company-3"),
      "owner"
    )
  );

  const result = await memberships.listByUser(userId);

  expect(result).toHaveLength(2);

  expect(result.map((item) => item.companyId.value))
    .toEqual(["company-1", "company-2"]);
});
