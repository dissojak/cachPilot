
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CompanyForm from "./company-form";
import { getUserCompanyMemberships } from "@/container/onboarding";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }
  const companies = await getUserCompanyMemberships(
  session.user.id
);

if (companies.length > 0) {
  redirect("/companies");
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
          width: "100%",
          maxWidth: 520,
          padding: 36,
        }}
      >
        <p className="mono">CashPilot / Onboarding</p>

        <h1
          style={{
            fontSize: 36,
            margin: "16px 0 8px",
          }}
        >
          Create your company
        </h1>

        <p
          style={{
            color: "#4A6256",
            marginBottom: 28,
          }}
        >
          Welcome, {session.user.name ?? "User"}.
          Set up your business workspace.
        </p>

        <CompanyForm />

        <p
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "#4A6256",
          }}
        >
          Your account will be assigned the Owner role.
        </p>
      </section>
    </main>
  );
}
