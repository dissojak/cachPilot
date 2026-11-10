import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Permission, ResolvedActor } from "@cashpilot/application";
import { auth } from "@/auth";
import { useCases } from "@/container";

export const ACTIVE_COMPANY_COOKIE = "cp_company";

/**
 * The signed-in user, resolved once per request (React cache). The active
 * company comes from a cookie but ResolveActor only accepts it when the user
 * is really a member (D9) — never trust a company id from the browser.
 */
export const getActor = cache(async (): Promise<ResolvedActor | null> => {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const store = await cookies();
  return useCases.resolveActor.execute({
    email,
    name: session.user?.name ?? email,
    provider: "google",
    subject: session.user?.id ?? email,
    preferredCompanyId: store.get(ACTIVE_COMPANY_COOKIE)?.value,
  });
});

export type Actor = ResolvedActor & { companyId: string; role: NonNullable<ResolvedActor["role"]> };

/** Signed in and member of a company, else redirect to /login or /onboarding. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!actor.companyId || !actor.role) redirect("/onboarding");
  return actor as Actor;
}

/**
 * UX only: sends the user to /forbidden instead of showing a page they cannot
 * use. The use case still checks the permission on the server.
 */
export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireActor();
  if (!actor.permissions.includes(permission)) redirect("/forbidden");
  return actor;
}

export function can(actor: Actor, permission: Permission) {
  return actor.permissions.includes(permission);
}
