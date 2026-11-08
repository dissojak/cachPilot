import Link from "next/link";
import { requireCompanyActor } from "@/lib/company-actor";
import { getCompanyMembers } from "@/container/onboarding";
import InviteMemberForm from "./invite-member-form";
import MemberActions from "./member-actions";

interface Props {
  params: Promise<{
    companyId: string;
  }>;
}

const roleLabels = {
  owner: "Owner",
  finance_manager: "Finance Manager",
  collaborator: "Collaborator",
};

export default async function CompanyMembersPage({
  params,
}: Props) {
  // 1. Récupérer l'identifiant de l'entreprise
  const { companyId } = await params;

  // 2. Vérifier la session et l'appartenance à l'entreprise
  const actor = await requireCompanyActor(companyId);

  // 3. Récupérer les membres réels depuis MongoDB
  const members = await getCompanyMembers(companyId);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
        minHeight: "100vh",
      }}
    >
      {/* Retour au workspace */}
      <Link
        href={`/companies/${companyId}`}
        style={{
          color: "#1F6B4E",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Back to Company
      </Link>

      {/* En-tête */}
      <header style={{ marginTop: 32 }}>
        <p className="mono">
          CashPilot / Company Management
        </p>

        <h1
          style={{
            fontSize: 40,
            marginTop: 12,
          }}
        >
          Team Members
        </h1>

        <p
          style={{
            color: "#4A6256",
            marginTop: 12,
          }}
        >
          Company: <strong>{actor.companyName}</strong>
        </p>

        <p style={{ marginTop: 8 }}>
          Total members: <strong>{members.length}</strong>
        </p>
      </header>

      {/* Liste des membres */}
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
              flexWrap: "wrap",
            }}
          >
            {/* Informations utilisateur */}
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                }}
              >
                {member.name}
              </h3>

              <p
                style={{
                  marginTop: 8,
                  color: "#4A6256",
                }}
              >
                {member.email}
              </p>
            </div>

            {/* Rôle du membre */}
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
            {/* Member management - Owner only */}
            {actor.role === "owner" &&
            member.role !== "owner" && (
                <MemberActions
                companyId={companyId}
                userId={member.userId}
                currentRole={member.role}
                />
            )}
          </article>
          
        ))}
      </section>

      {/* Aucun membre */}
      {members.length === 0 && (
        <section
          className="glass"
          style={{
            padding: 24,
            marginTop: 24,
          }}
        >
          <p>No members found.</p>
        </section>
      )}

      {/* Formulaire : accessible uniquement au propriétaire */}
      {actor.role === "owner" && (
        <InviteMemberForm companyId={companyId} />
      )}
    </main>
  );
}
