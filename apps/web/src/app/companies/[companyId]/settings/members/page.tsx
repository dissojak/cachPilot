
import Link from "next/link";
import { requireCompanyActor } from "@/lib/company-actor";
import { getCompanyMembers } from "@/container/onboarding";

interface Props {
  params: Promise<{ companyId: string }>;
}

const roleLabels = {
  owner: "Owner",
  finance_manager: "Finance Manager",
  collaborator: "Collaborator",
};

export default async function CompanyMembersPage({
  params,
}: Props) {
  const { companyId } = await params;

  // Vérifie la session et l'appartenance à l'entreprise
  const actor = await requireCompanyActor(companyId);

  // Récupère les membres depuis MongoDB
  const members = await getCompanyMembers(companyId);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
      }}
    >
      <Link href={`/companies/${companyId}`}>
        Back to Company
      </Link>

      <header style={{ marginTop: 32 }}>
        <p className="mono">
          CashPilot / Company Management
        </p>

        <h1>Team Members</h1>

        <p>
          Company: <strong>{actor.companyName}</strong>
        </p>

        <p>
          Total members: {members.length}
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gap: 16,
          marginTop: 32,
        }}
      >
        {members.map((member) => (
          <article
            key={member.userId}
            className="glass"
            style={{
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                {member.name}
              </h3>

              <p style={{ marginTop: 8 }}>
                {member.email}
              </p>
            </div>

            <div>
              <span
                style={{
                  padding: "8px 14px",
                  borderRadius: 20,
                  background: "#E0EDE5",
                  color: "#1F6B4E",
                  fontWeight: 600,
                }}
              >
                {roleLabels[member.role]}
              </span>
            </div>
          </article>
        ))}
      </section>

      {members.length === 0 && (
        <p>No members found.</p>
      )}
    </main>
  );
}
