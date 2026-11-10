import { PageHeader, Card, StatusChip } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requireActor, can } from "@/lib/session";
import { roleLabel } from "@/lib/format";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { inviteMemberAction, changeMemberRoleAction, removeMemberAction } from "../actions";

const roles = [
  { value: "collaborator", label: "Collaborator — submits expenses" },
  { value: "finance_manager", label: "Finance manager — invoices, payments, forecast" },
  { value: "owner", label: "Owner — approves expenses, manages the company" },
];

export default async function MembersPage() {
  const actor = await requireActor();
  const members = await useCases.listMembers.execute(actor);
  const manage = can(actor, "members.manage");

  return (
    <main className="shell">
      <PageHeader eyebrow="Settings" title="Members" description="Roles are checked on the server for every action, not only hidden in the interface." />
      <div className="grid-2">
        <Card title={`${members.length} member${members.length === 1 ? "" : "s"}`}>
          <div className="list">
            {members.map((member) => (
              <div key={member.userId} className="alert-item" style={{ borderLeftColor: "var(--pine-600)", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div><strong>{member.name}{member.userId === actor.userId ? " (you)" : ""}</strong><small className="muted">{member.email}</small></div>
                  <StatusChip status={member.role === "owner" ? "active" : member.role === "finance_manager" ? "validated" : "draft"} label={roleLabel[member.role] ?? member.role} />
                </div>
                {manage && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
                    <ActionForm action={changeMemberRoleAction} className="form-row">
                      <input type="hidden" name="memberUserId" value={member.userId} />
                      <SelectField label="Role" name="role" defaultValue={member.role} options={roles.map((role) => ({ value: role.value, label: roleLabel[role.value] ?? role.value }))} />
                      <SubmitButton variant="secondary" small>Change role</SubmitButton>
                    </ActionForm>
                    <ActionForm action={removeMemberAction} className="inline-form">
                      <input type="hidden" name="memberUserId" value={member.userId} />
                      <SubmitButton variant="danger" small>Remove</SubmitButton>
                    </ActionForm>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        {manage && (
          <Card title="Add a member">
            <p className="muted">The person must sign in to CashPilot once with Google; then add their e-mail here.</p>
            <ActionForm action={inviteMemberAction} resetOnSuccess>
              <Field label="E-mail" name="email" type="email" required />
              <SelectField label="Role" name="role" options={roles} />
              <SubmitButton>Add member</SubmitButton>
            </ActionForm>
          </Card>
        )}
      </div>
    </main>
  );
}
