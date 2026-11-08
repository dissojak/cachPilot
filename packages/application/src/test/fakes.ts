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
  async byId(id: UserId) { return this.items.get(id.value) ?? null; }
  async byEmail(email: string) { return [...this.items.values()].find((user) => user.email === email) ?? null; }
  async save(user: User) { this.items.set(user.id.value, user); }
}

export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly items = new Map<string, Membership>();
  private key(userId: UserId, companyId: CompanyId) { return `${userId.value}:${companyId.value}`; }
  async byUserAndCompany(userId: UserId, companyId: CompanyId) { return this.items.get(this.key(userId, companyId)) ?? null; }
  async listByCompany(companyId: CompanyId) { return [...this.items.values()].filter((item) => item.companyId.equals(companyId)); }
  async save(membership: Membership) { this.items.set(this.key(membership.userId, membership.companyId), membership); }
  async remove(userId: UserId, companyId: CompanyId) { this.items.delete(this.key(userId, companyId)); }
}
