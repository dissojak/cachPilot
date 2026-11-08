import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { users, memberships, demo, ensureDb } from "@/container";
import { User, Membership, CompanyId } from "@cashpilot/domain";

export type Actor = { userId: string; companyId: string; role: "owner" | "finance_manager" | "collaborator"; name: string | null; email: string };

export async function requireActor(): Promise<Actor> {
  await ensureDb();
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  let user = await users.byEmail(email);
  if (!user) {
    const candidate = User.fromOAuth({
      email,
      name: session.user?.name ?? email,
      provider: "google",
      subject: session.user?.id ?? email,
    });
    try {
      await users.save(candidate);
      user = candidate;
    } catch {
      user = await users.byEmail(email);
      if (!user) throw new Error("User persistence failed");
    }
  }

  const membershipList = await memberships.listByUser(user.id);
  let membership = membershipList[0];
  if (!membership) {
    const companyMemberships = await memberships.listByCompany(CompanyId.from(demo.companyId));
    const role = companyMemberships.length === 0 ? "owner" : "collaborator";
    membership = Membership.create(user.id, CompanyId.from(demo.companyId), role);
    await memberships.save(membership);
  }

  return { userId: user.id.value, companyId: membership.companyId.value, role: membership.role, name: session.user?.name ?? null, email };
}
