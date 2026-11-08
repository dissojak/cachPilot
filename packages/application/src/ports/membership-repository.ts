import {
  Membership,
  UserId,
  CompanyId,
} from "@cashpilot/domain";

export interface MembershipRepository {
  byUserAndCompany(
    userId: UserId,
    companyId: CompanyId
  ): Promise<Membership | null>;

  listByCompany(
    companyId: CompanyId
  ): Promise<Membership[]>;

  listByUser(
    userId: UserId
  ): Promise<Membership[]>;

  // Méthode existante, conservée pour compatibilité
  save(membership: Membership): Promise<void>;

  // Création : ne doit jamais écraser un membre existant
  create(membership: Membership): Promise<void>;

  // Modification : ne doit jamais modifier un owner
  updateRole(
    userId: UserId,
    companyId: CompanyId,
    role: "finance_manager" | "collaborator"
  ): Promise<void>;

  remove(
    userId: UserId,
    companyId: CompanyId
  ): Promise<void>;
}
