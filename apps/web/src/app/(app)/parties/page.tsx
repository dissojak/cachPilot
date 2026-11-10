import Link from "next/link";
import { PageHeader, Card, EmptyState, StatusChip } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { createPartyAction } from "./actions";

export default async function PartiesPage() {
  const actor = await requirePermission("parties.view");
  const parties = await useCases.listParties.execute(actor);

  return (
    <main className="shell">
      <PageHeader eyebrow="Customers & suppliers" title="Parties" description="Each customer or supplier belongs to your company only, with its invoice and payment history." />
      <div className="grid-2">
        <Card title={`${parties.length} ${parties.length === 1 ? "party" : "parties"}`}>
          {parties.length === 0
            ? <EmptyState title="No customer yet" text="Add your first customer to start invoicing." />
            : (
              <div className="list">
                {parties.map((party) => (
                  <Link key={party.id} href={`/parties/${party.id}`} className="alert-item" style={{ borderLeftColor: party.type === "customer" ? "var(--pine-600)" : "var(--lake)" }}>
                    <strong>{party.name}</strong>
                    <small className="muted">{[party.email, party.phone].filter(Boolean).join(" · ") || "No contact details"}</small>{" "}
                    <StatusChip status={party.type === "customer" ? "active" : "draft"} label={party.type === "customer" ? "Customer" : "Supplier"} />
                  </Link>
                ))}
              </div>
            )}
        </Card>
        {can(actor, "parties.manage") && (
          <Card title="Add a customer or supplier">
            <ActionForm action={createPartyAction} resetOnSuccess>
              <SelectField label="Type" name="type" options={[{ value: "customer", label: "Customer" }, { value: "supplier", label: "Supplier" }]} />
              <Field label="Name" name="name" required />
              <div className="form-row">
                <Field label="E-mail" name="email" type="email" />
                <Field label="Phone" name="phone" type="tel" />
              </div>
              <Field label="Address" name="address" />
              <SubmitButton>Add</SubmitButton>
            </ActionForm>
          </Card>
        )}
      </div>
    </main>
  );
}
