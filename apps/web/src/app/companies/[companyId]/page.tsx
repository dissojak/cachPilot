
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  getCreatedCompanyForUser,
} from "@/container/onboarding";

interface Props {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function CompanyWorkspacePage({
  params,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { companyId } = await params;

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
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
        minHeight: "100vh",
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

        <h1 style={{ fontSize: 40 }}>
          {company.name}
        </h1>

        <p>Sector: {company.sector}</p>

        <p>
          Your role: <strong>{company.role}</strong>
        </p>

        <p style={{ marginTop: 24 }}>
          Your company workspace is ready.
        </p>

        <p>
          Financial modules will be connected to
          this company's MongoDB data.
        </p>
      </section>
    </main>
  );
}
