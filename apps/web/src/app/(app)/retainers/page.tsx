import Link from "next/link";
import { PageHeader, Card, EmptyState, StatusChip } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { money, date, statusLabel } from "@/lib/format";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { createRetainerAction, toggleRetainerAction, generateRetainerInvoicesAction } from "./actions";

/** Original feature (digital agency): recurring retainers become validated invoices each period. */
export default async function RetainersPage() {
  const actor = await requirePermission("retainers.manage");
  const [retainers, customers] = await Promise.all([
    useCases.listRetainers.execute(actor),
    useCases.listParties.execute({ ...actor, type: "customer" }),
  ]);
  const names = new Map(customers.map((customer) => [customer.id, customer.name]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="shell">
      <PageHeader title="Recurring retainers"
        description="For a monthly service fee, such as an agency's maintenance or a training contract. A retainer bills the customer every N days, and each due period becomes a validated invoice that the forecast sees."
        actions={retainers.length > 0 && (
          <ActionForm action={generateRetainerInvoicesAction} className="inline-form">
            <SubmitButton>Generate due invoices</SubmitButton>
          </ActionForm>
        )} />
      <div className="grid-2">
        <Card title="Retainers">
          {retainers.length === 0 ? <EmptyState title="No retainer yet" text="Create one for a customer you bill every month, and it will issue invoices on schedule." /> : (
            <div className="list">
              {retainers.map((retainer) => (
                <div key={retainer.id} className={`alert-item member-row ${retainer.status === "active" ? "accent-pine" : "accent-muted"}`}>
                  <div className="row-between">
                    <strong>{retainer.name}</strong>
                    <StatusChip status={retainer.status} label={statusLabel[retainer.status] ?? retainer.status} />
                  </div>
                  <small className="muted">{names.get(retainer.customerId) ?? "Unknown customer"} · {money(retainer.amountMillimes)} every {retainer.intervalDays} days · next {date(retainer.nextGenerationDate)}</small>
                  <div className="actions-row">
                    <Link href={`/retainers/${retainer.id}/edit`} className="btn btn-secondary btn-small">Edit</Link>
                    <ActionForm action={toggleRetainerAction} className="inline-form">
                      <input type="hidden" name="retainerId" value={retainer.id} />
                      <input type="hidden" name="to" value={retainer.status === "active" ? "pause" : "resume"} />
                      <SubmitButton variant="secondary" small>{retainer.status === "active" ? "Pause" : "Resume"}</SubmitButton>
                    </ActionForm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="New retainer">
          {customers.length === 0 ? <EmptyState title="No customer yet" text="A retainer bills a customer, so add one first." action={<Link href="/parties" className="btn btn-secondary btn-small">Add a customer</Link>} /> : (
            <ActionForm action={createRetainerAction} resetOnSuccess>
              <SelectField label="Customer" name="customerId" options={customers.map((customer) => ({ value: customer.id, label: customer.name }))} />
              <Field label="Name" name="name" placeholder="Monthly maintenance" required />
              <div className="form-row">
                <Field label="Amount (DNT)" name="amount" inputMode="decimal" required />
                <Field label="Every (days)" name="intervalDays" type="number" min={1} max={366} defaultValue={30} required />
              </div>
              <Field label="First invoice date" name="nextGenerationDate" type="date" defaultValue={today} required />
              <SubmitButton>Create retainer</SubmitButton>
            </ActionForm>
          )}
        </Card>
      </div>
    </main>
  );
}
