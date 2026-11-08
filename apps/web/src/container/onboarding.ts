import {
  RegisterCompany,
  GetCompany,
  UpdateCompany,
  InviteMember,
  ChangeMemberRole,
  RemoveMember,
  CreateParty,
  ListParties,
  CreateInvoiceDraft,
  ListInvoices,
  GetInvoice,
  ValidateInvoice,
} from "@cashpilot/application";
import {
  MongoCompanyRepository,
  MongoMembershipRepository,
  MongoObjectIdGenerator,
  MongoTransactionManager,
  MongoUserRepository,
  MongoPartyRepository,
  MongoInvoiceRepository
} from "@cashpilot/infra";
import { CompanyId, UserId } from "@cashpilot/domain";
const companyRepository =
  new MongoCompanyRepository();
const invoiceRepository =
  new MongoInvoiceRepository();
const membershipRepository =
  new MongoMembershipRepository();

const idGenerator =
  new MongoObjectIdGenerator();

const transactionManager =
  new MongoTransactionManager();

const userRepository = new MongoUserRepository();
const partyRepository = new MongoPartyRepository();

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
createParty: new CreateParty(
  partyRepository,
  membershipRepository,
  idGenerator
),

listParties: new ListParties(
  partyRepository,
  membershipRepository
),

createInvoiceDraft: new CreateInvoiceDraft(
  invoiceRepository,
  membershipRepository,
  partyRepository,
  idGenerator
),

listInvoices: new ListInvoices(
  invoiceRepository,
  membershipRepository
),

getInvoice: new GetInvoice(
  invoiceRepository,
  membershipRepository
),

validateInvoice: new ValidateInvoice(
  invoiceRepository,
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



