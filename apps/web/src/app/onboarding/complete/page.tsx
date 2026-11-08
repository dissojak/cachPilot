
import Link from "next/link";
import { auth } from "@/auth";
import { getCreatedCompanyForUser } from "@/container/onboarding";
import { notFound, redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{
    companyId?: string;
  }>;
}

export default async function OnboardingCompletePage({
  searchParams,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { companyId } = await searchParams;

  if (!companyId) {
    notFound();
  }

  const company = await getCreatedCompanyForUser(
    session.user.id,
    companyId
  );

  if (!company) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section
        className="glass"
        style={{
          maxWidth: 520,
          width: "100%",
          padding: 36,
        }}
      >
        <p className="mono">CashPilot</p>

        <h1>Company created successfully</h1>

        <p>
          <strong>Company:</strong> {company.name}
        </p>

        <p>
          <strong>Sector:</strong> {company.sector}
        </p>

        <p>
          <strong>Your role:</strong> {company.role}
        </p>

        <p>
          Your company is now registered.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 30,
          }}
        >
          <Link
            href={`/companies/${companyId}`}
            style={{
              display: "block",
              padding: "14px 20px",
              background: "#1F6B4E",
              color: "white",
              textAlign: "center",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go to Company Workspace
          </Link>

          <Link
            href="/companies"
            style={{
              display: "block",
              padding: "14px 20px",
              border: "1px solid #1F6B4E",
              color: "#1F6B4E",
              textAlign: "center",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View All Companies
          </Link>
        </div>
      </section>
    </main>
  );
}
