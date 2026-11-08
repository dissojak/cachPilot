import { requireActor } from "@/lib/auth-actor";
import { users, memberships, useCases, demo } from "@/container";
import { UserId, CompanyId } from "@cashpilot/domain";
import FadeIn from "@/components/fade-in";

const roleLabel: Record<string, string> = {
  owner: "Owner",
  finance_manager: "Finance manager",
  collaborator: "Collaborator",
};

const roleColor: Record<string, string> = {
  owner: "#1F6B4E",
  finance_manager: "#9C6B1E",
  collaborator: "#4A6256",
};

const roleBg: Record<string, string> = {
  owner: "rgba(31,107,78,0.12)",
  finance_manager: "rgba(227,168,87,0.18)",
  collaborator: "rgba(207,224,204,0.8)",
};

export default async function MembersPage() {
  const actor = await requireActor();
  const membershipList = await memberships.listByCompany(CompanyId.from(actor.companyId));

  const members = await Promise.all(
    membershipList.map(async (membership) => {
      const user = await users.byId(UserId.from(membership.userId.value));
      return {
        id: `${membership.userId.value}:${membership.companyId.value}`,
        userId: membership.userId.value,
        companyId: membership.companyId.value,
        role: membership.role,
        name: user?.snapshot().name ?? membership.userId.value,
        email: user?.snapshot().email ?? "—",
      };
    }),
  );

  return (
    <FadeIn>
      <main className="shell">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 28 }}>
        <div>
          <p className="mono">Settings</p>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>
            Members
          </h1>
        </div>
        <button type="button" style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>
          Invite member
        </button>
      </header>

      <p style={{ color: "#4A6256", maxWidth: 620, marginBottom: 20 }}>
        Roles come from the database membership records of your company. Only owners and finance managers can approve expenses or change invoices; collaborators submit documents.
      </p>

      <section style={{ display: "grid", gap: 12 }}>
        {members.map((member, index) => (
          <FadeIn key={member.id} delay={0.1 + index * 0.06}>
          <article className="glass" style={{ padding: 20, display: "grid", gridTemplateColumns: "1.4fr 1fr auto", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="nav-avatar" style={{ width: 42, height: 42, borderRadius: 16 }}>
                {member.name.split(/\s+/).map((part) => part[0]?.toUpperCase() ?? "").filter(Boolean).slice(0, 2).join("") || "U"}
              </div>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: "block" }}>{member.name}</strong>
                <span style={{ color: "#4A6256", fontSize: 13 }}>{member.email}</span>
              </div>
            </div>
            <div>
              <span className="mono">Role</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ padding: "6px 12px", borderRadius: 999, background: roleBg[member.role] ?? "rgba(207,224,204,0.8)", color: roleColor[member.role] ?? "#4A6256", fontWeight: 600, fontSize: 12 }}>
                  {roleLabel[member.role] ?? member.role}
                </span>
                {member.userId === demo.ownerUserId && (
                  <span className="mono" style={{ fontSize: 10, color: "#4A6256" }}>seeded</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["owner", "finance_manager"].includes(actor.role) && actor.userId !== member.userId && (
                <button type="button" style={{ height: 36, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(31,107,78,0.25)", background: "transparent", color: "#1F6B4E", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Change role
                </button>
              )}
            </div>
          </article>
          </FadeIn>
        ))}
      </section>

      <section className="glass" style={{ padding: 24, marginTop: 20 }}>
        <span className="mono">Your role</span>
        <p style={{ margin: "8px 0 0", color: "#4A6256" }}>
          You are signed in as <strong style={{ color: "#1F6B4E" }}>{roleLabel[actor.role] ?? actor.role}</strong> — your permissions were resolved from the memberships collection when you loaded this page, not from anything client-side.
        </p>
      </section>
    </main>
    </FadeIn>
  );
}
