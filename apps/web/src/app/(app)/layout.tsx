import NavSidebar from "@/components/nav-sidebar";
import { requireActor } from "@/lib/auth-actor";
import { companies } from "@/container";
import { CompanyId } from "@cashpilot/domain";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const company = await companies.byId(CompanyId.from(actor.companyId));
  return (
    <>
      <NavSidebar email={actor.email} name={actor.name} role={actor.role} companyName={company?.snapshot().name ?? null} />
      <div className="app-shell">{children}</div>
    </>
  );
}
