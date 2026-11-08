
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
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
      }}
    >
      <Link href="/companies">
        Back to companies
      </Link>

      <section
        className="glass"
        style={{
          padding: 32,
          marginTop: 32,
        }}
      >
        <p className="mono">CashPilot / Workspace</p>

        <h1>{actor.companyName}</h1>

        <p>Sector: {actor.sector}</p>

        <p>
          Your role: <strong>{actor.role}</strong>
        </p>

        <p>Company ID: {actor.companyId}</p>

        <h2 style={{ marginTop: 30 }}>
          Company Management
        </h2>

        <p>Company workspace is ready.</p>

        {/* Boutons de gestion */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 24,
            flexWrap: "wrap",
          }}
        >
          {/* Company Settings : uniquement Owner */}
          {actor.role === "owner" && (
            <Link
              href={`/companies/${companyId}/settings`}
              style={{
                display: "inline-block",
                padding: "12px 20px",
                borderRadius: 12,
                background: "#1F6B4E",
                color: "white",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Company Settings
            </Link>
          )}

          {/* Team Members : tous les membres */}
          <Link
            href={`/companies/${companyId}/members`}
            style={{
              display: "inline-block",
              padding: "12px 20px",
              borderRadius: 12,
              background: "#E0EDE5",
              color: "#1F6B4E",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Team Members
          </Link>
        </div>
      </section>
    </main>
  );
}
