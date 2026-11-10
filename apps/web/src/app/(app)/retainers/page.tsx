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
      <PageHeader eyebrow="Agency feature" title="Recurring retainers"
        description="A retainer bills a customer every N days. Due periods become validated invoices, so the forecast sees recurring revenue."
        actions={retainers.length > 0 && (
          <ActionForm action={generateRetainerInvoicesAction} className="inline-form">
            <SubmitButton>Generate due invoices</SubmitButton>
          </ActionForm>
        )} />
      <div className="grid-2">
        <Card title="Retainers">
          {retainers.length === 0 ? <EmptyState title="No retainer" text="Create a retainer for a customer you bill every month." /> : (
            <div className="list">
              {retainers.map((retainer) => (
                <div key={retainer.id} className="alert-item" style={{ borderLeftColor: retainer.status === "active" ? "var(--pine-600)" : "var(--sage-200)", display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong>{retainer.name}</strong>
                    <StatusChip status={retainer.status} label={statusLabel[retainer.status] ?? retainer.status} />
                  </div>
                  <small className="muted">{names.get(retainer.customerId) ?? "Unknown customer"} · {money(retainer.amountMillimes)} every {retainer.intervalDays} days · next {date(retainer.nextGenerationDate)}</small>
                  <ActionForm action={toggleRetainerAction} className="inline-form">
                    <input type="hidden" name="retainerId" value={retainer.id} />
                    <input type="hidden" name="to" value={retainer.status === "active" ? "pause" : "resume"} />
                    <SubmitButton variant="secondary" small>{retainer.status === "active" ? "Pause" : "Resume"}</SubmitButton>
                  </ActionForm>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="New retainer">
          {customers.length === 0 ? <p className="muted">Add a customer first.</p> : (
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
