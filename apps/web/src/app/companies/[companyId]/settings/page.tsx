
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  getCreatedCompanyForUser,
  onboardingUseCases,
} from "@/container/onboarding";

import CompanySettingsForm from "./company-settings-form";

interface Props {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function CompanySettingsPage({
  params,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { companyId } = await params;

  if (!/^[a-f0-9]{24}$/i.test(companyId)) {
    notFound();
  }

  const membership = await getCreatedCompanyForUser(
    session.user.id,
    companyId
  );

  if (!membership) {
    notFound();
  }

  if (membership.role !== "owner") {
    notFound();
  }

  const company =
    await onboardingUseCases.getCompany.execute({
      userId: session.user.id,
      companyId,
    });

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
        minHeight: "100vh",
      }}
    >
      <Link href={`/companies/${companyId}`}>
        Back to Company
      </Link>

      <header style={{ marginTop: 32 }}>
        <p className="mono">
          CashPilot / Company Settings
        </p>

        <h1 style={{ fontSize: 40 }}>
          Company Settings
        </h1>

        <p>
          Manage your company information.
        </p>
      </header>

      <section
        className="glass"
        style={{
          padding: 32,
          marginTop: 32,
          maxWidth: 640,
        }}
      >
        <CompanySettingsForm
          companyId={companyId}
          name={company.name}
          sector={company.sector}
          forecastThresholdMillimes={
            company.forecastThresholdMillimes
          }
        />
      </section>
    </main>
  );
}
