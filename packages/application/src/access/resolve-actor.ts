import { User, UserId, CompanyId, ROLE_PERMISSIONS } from "@cashpilot/domain";
import type { MembershipRole, Permission } from "@cashpilot/domain";
import type { UserRepository } from "../ports/user-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { IdGenerator } from "../ports/id-generator";

export interface ResolveActorInput {
  email: string;
  name: string;
  provider: string;
  subject: string;
  /** Company remembered by the browser; used only if a membership exists. */
  preferredCompanyId?: string;
}

export interface ResolvedActor {
  userId: string;
  name: string;
  email: string;
  companyId: string | null;
  role: MembershipRole | null;
  /** For the UI only (hide buttons); every use case checks again on the server. */
  permissions: readonly Permission[];
}

/**
 * Turns a signed-in identity into the acting user. Creates the user on first
 * sign-in but NEVER a membership: a user without a company goes to onboarding
 * (P0-5, BR-01). A company id coming from the browser is trusted only when the
 * user is really a member of it.
 */
export class ResolveActor {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: ResolveActorInput): Promise<ResolvedActor> {
    let user = await this.users.byEmail(input.email.trim().toLowerCase());
    if (!user) {
      user = User.fromOAuth({ id: UserId.from(this.ids.newId()), email: input.email, name: input.name, provider: input.provider, subject: input.subject });
      await this.users.save(user);
    }

    const memberships = await this.memberships.listByUser(user.id);
    const membership = memberships.find((item) => input.preferredCompanyId && item.companyId.equals(CompanyId.from(input.preferredCompanyId)))
      ?? memberships[0];

    return {
      userId: user.id.value,
      name: user.name,
      email: user.email,
      companyId: membership?.companyId.value ?? null,
      role: membership?.role ?? null,
      permissions: membership ? ROLE_PERMISSIONS[membership.role] : [],
    };
  }
}
