import Link from "next/link";
import { PageHeader, Card, EmptyState, StatusChip } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { createPartyAction } from "./actions";

export default async function PartiesPage() {
  const actor = await requirePermission("parties.view");
  const parties = await useCases.listParties.execute(actor);
  const canManage = can(actor, "parties.manage");
  const customers = parties.filter((party) => party.type === "customer").length;

  return (
    <main className="shell">
      <PageHeader title="Customers and suppliers"
        description="The people and businesses you bill or pay. Open one to see its invoices and payments." />
      <div className="grid-2">
        <Card title={`${parties.length} ${parties.length === 1 ? "contact" : "contacts"}`} aside={<span className="muted">{customers} customers</span>}>
          {parties.length === 0
            ? <EmptyState title="No customer yet" text={canManage ? "Add your first customer, then you can issue an invoice to them." : "Customers appear here once an owner or finance manager adds them."} />
            : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Name</th><th>Type</th><th>Contact</th></tr></thead>
                  <tbody>
                    {parties.map((party) => (
                      <tr key={party.id}>
                        <td><Link href={`/parties/${party.id}`} className="table-main">{party.name}</Link></td>
                        <td><StatusChip status={party.type === "customer" ? "active" : "draft"} label={party.type === "customer" ? "Customer" : "Supplier"} /></td>
                        <td className="muted">{[party.email, party.phone].filter(Boolean).join(", ") || "No contact details"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </Card>
        {canManage && (
          <Card title="Add a contact">
            <ActionForm action={createPartyAction} resetOnSuccess className="form">
              <SelectField label="Type" name="type" options={[{ value: "customer", label: "Customer" }, { value: "supplier", label: "Supplier" }]} />
              <Field label="Name" name="name" required />
              <div className="form-row">
                <Field label="E-mail" name="email" type="email" />
                <Field label="Phone" name="phone" type="tel" />
              </div>
              <Field label="Address" name="address" />
              <div className="form-footer"><SubmitButton>Add contact</SubmitButton></div>
            </ActionForm>
          </Card>
        )}
      </div>
    </main>
  );
}
