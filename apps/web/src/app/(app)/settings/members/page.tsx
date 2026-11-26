import { PageHeader, Card, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requireActor, can } from "@/lib/session";
import { roleLabel } from "@/lib/format";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { inviteMemberAction, changeMemberRoleAction, removeMemberAction } from "../actions";

const roles = [
  { value: "collaborator", label: "Collaborator: submits expenses" },
  { value: "finance_manager", label: "Finance manager: invoices, payments, forecast" },
  { value: "owner", label: "Owner: approves expenses, manages the company" },
];

export default async function MembersPage() {
  const actor = await requireActor();
  const members = await useCases.listMembers.execute(actor);
  const manage = can(actor, "members.manage");

  return (
    <main className="shell">
      <PageHeader title="Members" description="Who can use this company, and what each person is allowed to do. Every action is checked on the server." />
      <div className="grid-2">
        <Card title={`${members.length} ${members.length === 1 ? "member" : "members"}`}>
          {members.length === 0
            ? <EmptyState title="No member" text="Add the people who work on this company." />
            : (
              <ul className="list plain-list">
                {members.map((member) => (
                  <li key={member.userId} className="member-item">
                    <div className="row-between">
                      <div>
                        <strong>{member.name}{member.userId === actor.userId ? " (you)" : ""}</strong>
                        <small className="muted member-email">{member.email}</small>
                      </div>
                      <span className={`role-pill role-pill-${member.role}`}>{roleLabel[member.role] ?? member.role}</span>
                    </div>
                    {manage && member.userId !== actor.userId && (
                      <div className="member-actions">
                        <ActionForm action={changeMemberRoleAction} className="member-role-form">
                          <input type="hidden" name="memberUserId" value={member.userId} />
                          <SelectField label="Role" name="role" defaultValue={member.role} options={roles.map((role) => ({ value: role.value, label: roleLabel[role.value] ?? role.value }))} />
                          <SubmitButton variant="secondary" small>Save role</SubmitButton>
                        </ActionForm>
                        <ActionForm action={removeMemberAction} className="inline-form">
                          <input type="hidden" name="memberUserId" value={member.userId} />
                          <SubmitButton variant="danger" small>Remove</SubmitButton>
                        </ActionForm>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
        </Card>
        {manage && (
          <Card title="Add a member">
            <p className="muted page-lead">The person must sign in to CashPilot once with Google first. Then add the same e-mail here.</p>
            <ActionForm action={inviteMemberAction} resetOnSuccess className="form">
              <Field label="E-mail" name="email" type="email" required />
              <SelectField label="Role" name="role" options={roles} />
              <div className="form-footer"><SubmitButton>Add member</SubmitButton></div>
            </ActionForm>
          </Card>
        )}
      </div>
    </main>
  );
}
