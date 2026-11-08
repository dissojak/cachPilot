
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
          Your company is now registered in MongoDB Atlas.
        </p>
      </section>
    </main>
  );
}
