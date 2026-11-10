import { redirect } from "next/navigation";
import { getActor } from "@/lib/session";

/** Send each role to the first page it can use. */
export default async function HomePage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!actor.companyId) redirect("/onboarding");
  redirect(actor.permissions.includes("dashboard.view") ? "/dashboard" : "/expenses");
}
