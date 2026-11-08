import Link from "next/link";
import { requireCompanyActor } from "@/lib/company-actor";

interface Props {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyWorkspacePage({
  params,
}: Props) {
  const { companyId } = await params;
  const actor = await requireCompanyActor(companyId);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 40 }}>
      <Link href="/companies">
        Back to companies
      </Link>

      <section className="glass" style={{ padding: 32, marginTop: 32 }}>
        <p className="mono">CashPilot / Workspace</p>

        <h1>{actor.companyName}</h1>

        <p>Sector: {actor.sector}</p>
        <p>Your role: {actor.role}</p>
        <p>Company ID: {actor.companyId}</p>

        <h2 style={{ marginTop: 30 }}>Company Management</h2>

        <p>Company workspace is ready.</p>
      </section>
    </main>
  );
}