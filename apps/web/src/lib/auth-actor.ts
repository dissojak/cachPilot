import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { users, memberships, demo } from "@/container";
import { User, Membership, CompanyId } from "@cashpilot/domain";

export type Actor = { userId: string; companyId: string; role: "owner" | "finance_manager" | "collaborator" };

export async function requireActor(): Promise<Actor> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  let user = await users.byEmail(email);
  if (!user) {
    user = User.fromOAuth({
      email,
      name: session.user?.name ?? email,
      provider: "google",
      subject: session.user?.id ?? email,
    });
    await users.save(user);
  }

  const membershipList = await memberships.listByUser(user.id);
  let membership = membershipList[0];
  if (!membership) {
    const companyMemberships = await memberships.listByCompany(CompanyId.from(demo.companyId));
    const role = companyMemberships.length === 0 ? "owner" : "collaborator";
    membership = Membership.create(user.id, CompanyId.from(demo.companyId), role);
    await memberships.save(membership);
  }

  return { userId: user.id.value, companyId: membership.companyId.value, role: membership.role };
}
