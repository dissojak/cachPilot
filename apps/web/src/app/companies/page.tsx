
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  getUserCompanyMemberships,
} from "@/container/onboarding";

export default async function CompaniesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const companies = await getUserCompanyMemberships(
    session.user.id
  );

  if (companies.length === 0) {
    redirect("/onboarding");
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: 40 }}>
        <p className="mono">
          CashPilot / Workspace
        </p>

        <h1 style={{ fontSize: 40 }}>
          Your Companies
        </h1>

        <p style={{ color: "#4A6256" }}>
          Select a company to access your workspace.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {companies.map((company) => (
          <article
            key={company.companyId}
            className="glass"
            style={{ padding: 28 }}
          >
            <p className="mono">
              {company.sector}
            </p>

            <h2 style={{ fontSize: 26 }}>
              {company.companyName}
            </h2>

            <p>
              Role: <strong>{company.role}</strong>
            </p>

            <Link
              href={`/companies/${company.companyId}`}
              style={{
                display: "inline-block",
                marginTop: 20,
                padding: "12px 20px",
                background: "#1F6B4E",
                borderRadius: 12,
                color: "white",
                textDecoration: "none",
              }}
            >
              View Company
            </Link>
          </article>
        ))}
      </section>

      <div style={{ marginTop: 40 }}>
        <Link href="/onboarding">
          + Create another company
        </Link>
      </div>
    </main>
  );
}
