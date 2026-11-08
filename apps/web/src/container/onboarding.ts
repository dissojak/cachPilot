import {
  RegisterCompany,
  GetCompany,
  UpdateCompany,
  InviteMember,
  ChangeMemberRole,
  RemoveMember,
} from "@cashpilot/application";
import {
  MongoCompanyRepository,
  MongoMembershipRepository,
  MongoObjectIdGenerator,
  MongoTransactionManager,
  MongoUserRepository
} from "@cashpilot/infra";
import { CompanyId, UserId } from "@cashpilot/domain";
const companyRepository =
  new MongoCompanyRepository();

const membershipRepository =
  new MongoMembershipRepository();

const idGenerator =
  new MongoObjectIdGenerator();

const transactionManager =
  new MongoTransactionManager();

const userRepository = new MongoUserRepository();

export const onboardingUseCases = {
  registerCompany: new RegisterCompany(
    companyRepository,
    membershipRepository,
    idGenerator,
    transactionManager
  ),

  updateCompany: new UpdateCompany(
    companyRepository,
    membershipRepository
  ),
  getCompany: new GetCompany(
  companyRepository,
  membershipRepository
),
inviteMember: new InviteMember(
  membershipRepository,
  userRepository
),
changeMemberRole: new ChangeMemberRole(
  membershipRepository
),

removeMember: new RemoveMember(
  membershipRepository
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


export async function getCompanyMembers(
  companyId: string
) {
  const memberships =
    await membershipRepository.listByCompany(
      CompanyId.from(companyId)
    );

  return Promise.all(
    memberships.map(async (membership) => {
      const user = await userRepository.byId(
        membership.userId
      );

      const userData = user?.snapshot();

      return {
        userId: membership.userId.value,
        companyId: membership.companyId.value,
        role: membership.role,
        name: userData?.name ?? "Unknown user",
        email: userData?.email ?? "Unknown email",
      };
    })
  );
}
export async function findExistingUserByEmail(
  email: string
) {
  return userRepository.byEmail(
    email.trim().toLowerCase()
  );
}



