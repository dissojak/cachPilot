import type { Membership } from "@cashpilot/domain";
import type { UserId } from "@cashpilot/domain";
import type { CompanyId } from "@cashpilot/domain";

export interface MembershipRepository {
  byUserAndCompany(userId: UserId, companyId: CompanyId): Promise<Membership | null>;
  listByCompany(companyId: CompanyId): Promise<Membership[]>;
  listByUser(userId: UserId): Promise<Membership[]>;
  save(membership: Membership): Promise<void>;
  remove(userId: UserId, companyId: CompanyId): Promise<void>;
}
