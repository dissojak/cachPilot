
import { RegisterCompany } from "@cashpilot/application";
import { CompanyId, UserId } from "@cashpilot/domain";
import {
  MongoCompanyRepository,
  MongoMembershipRepository,
  MongoObjectIdGenerator,
  MongoTransactionManager,
} from "@cashpilot/infra";

const companyRepository =
  new MongoCompanyRepository();

const membershipRepository =
  new MongoMembershipRepository();

const idGenerator =
  new MongoObjectIdGenerator();

const transactionManager =
  new MongoTransactionManager();

export const onboardingUseCases = {
  registerCompany: new RegisterCompany(
    companyRepository,
    membershipRepository,
    idGenerator,
    transactionManager
  ),
};

export async function getCreatedCompanyForUser(
  userId: string,
  companyId: string
) {
  const membership =
    await membershipRepository.byUserAndCompany(
      UserId.from(userId),
      CompanyId.from(companyId)
    );

  if (!membership) {
    return null;
  }

  const company = await companyRepository.byId(
    CompanyId.from(companyId)
  );

  if (!company) {
    return null;
  }

  return {
    name: company.name,
    sector: company.sector,
    role: membership.role,
  };
}

export async function getUserCompanyMemberships(
  userId: string
) {
  const memberships =
    await membershipRepository.listByUser(
      UserId.from(userId)
    );

  return Promise.all(
    memberships.map(async (membership) => {
      const company = await companyRepository.byId(
        membership.companyId
      );

      if (!company) {
        return null;
      }

      
    return {
      companyId: company.id.value,
      companyName: company.name,
      sector: company.sector,
      role: membership.role,
    };

    })
  ).then((results) =>
    results.filter(
      (item): item is NonNullable<typeof item> =>
        item !== null
    )
  );
}


