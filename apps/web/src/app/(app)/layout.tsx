import NavSidebar from "@/components/nav-sidebar";
import { requireActor } from "@/lib/session";
import { useCases } from "@/container";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const companies = await useCases.listMyCompanies.execute({ userId: actor.userId });
  const current = companies.find((company) => company.companyId === actor.companyId);
  return (
    <>
      <NavSidebar
        email={actor.email}
        name={actor.name}
        role={actor.role}
        companyName={current?.name ?? null}
        companyId={actor.companyId}
        companies={companies}
        permissions={actor.permissions}
      />
      <div className="app-shell">{children}</div>
    </>
  );
}
