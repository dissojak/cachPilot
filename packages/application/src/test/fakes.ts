import { Company, User, Membership } from "@cashpilot/domain";
import { CompanyId, UserId } from "@cashpilot/domain";
import {
  CompanyRepository,
  UserRepository,
  MembershipRepository,
} from "../ports";

export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly items = new Map<string, Company>();
  async byId(id: CompanyId) { return this.items.get(id.value) ?? null; }
  async save(company: Company) { this.items.set(company.id.value, company); }
}


export class InMemoryUserRepository implements UserRepository {
  private readonly items = new Map<string, User>();

  async byId(id: UserId): Promise<User | null> {
    return this.items.get(id.value) ?? null;
  }

  async byEmail(email: string): Promise<User | null> {
    return (
      [...this.items.values()].find(
        (user) => user.email === email.trim().toLowerCase()
      ) ?? null
    );
  }

  async save(user: User): Promise<void> {
    this.items.set(user.id.value, user);
  }

  async resolveOAuthIdentity(identity: {
    provider: string;
    subject: string;
    email: string;
    name: string;
  }): Promise<User> {
    const existing = [...this.items.values()].find((user) => {
      const data = user.snapshot();

      return (
        data.oauthProvider === identity.provider &&
        data.oauthSubject === identity.subject
      );
    });

    if (existing) {
      return existing;
    }

    const user = User.fromOAuth({
      email: identity.email,
      name: identity.name,
      provider: identity.provider,
      subject: identity.subject,
    });

    await this.save(user);

    return user;
  }
}


export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly items = new Map<string, Membership>();
  private key(userId: UserId, companyId: CompanyId) { return `${userId.value}:${companyId.value}`; }
  async byUserAndCompany(userId: UserId, companyId: CompanyId) { return this.items.get(this.key(userId, companyId)) ?? null; }
  async listByCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(membership: Membership) { this.items.set(this.key(membership.userId, membership.companyId), membership); }
  async remove(userId: UserId, companyId: CompanyId) { this.items.delete(this.key(userId, companyId)); }
  
  async listByUser(userId: UserId): Promise<Membership[]> {
    return [...this.items.values()].filter(
      (membership) => membership.userId.equals(userId)
    );
  }
  
async create(membership: Membership): Promise<void> {
  const key = this.key(
    membership.userId,
    membership.companyId
  );

  if (this.items.has(key)) {
    throw new Error(
      "User is already a member of this company"
    );
  }

  this.items.set(key, membership);
}

async updateRole(
  userId: UserId,
  companyId: CompanyId,
  role: "finance_manager" | "collaborator"
): Promise<void> {
  const key = this.key(userId, companyId);

  const existing = this.items.get(key);

  if (!existing) {
    throw new Error("Membership not found");
  }

  if (existing.role === "owner") {
    throw new Error(
      "Owner role cannot be changed"
    );
  }

  const updated = Membership.create(
    userId,
    companyId,
    role
  );

  this.items.set(key, updated);
}


}
