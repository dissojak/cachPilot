import Link from "next/link";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { moneyInput } from "@/lib/format";
import type { ActionResult } from "@/lib/action";

type Customer = { id: string; name: string };
type Draft = { id: string; customerId: string; issueDate: string; dueDate: string; lines: { description: string; quantity: number; unitPriceMillimes: number }[] };

/** Shared by "new" and "edit": one line per invoice keeps the form simple. */
export function InvoiceForm({ action, customers, draft, submitLabel }: {
  action: (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  customers: Customer[];
  draft?: Draft;
  submitLabel: string;
}) {
  if (customers.length === 0) {
    return <p className="muted">Add a customer first on the <Link href="/parties">Customers &amp; suppliers</Link> page.</p>;
  }
  const today = new Date().toISOString().slice(0, 10);
  const line = draft?.lines[0];
  return (
    <ActionForm action={action}>
      {draft && <input type="hidden" name="invoiceId" value={draft.id} />}
      <SelectField label="Customer" name="customerId" defaultValue={draft?.customerId} options={customers.map((customer) => ({ value: customer.id, label: customer.name }))} />
      <div className="form-row">
        <Field label="Issue date" name="issueDate" type="date" defaultValue={draft?.issueDate ?? today} required />
        <Field label="Due date" name="dueDate" type="date" defaultValue={draft?.dueDate} required />
      </div>
      <Field label="Description" name="description" defaultValue={line?.description} placeholder="Website redesign" required />
      <div className="form-row">
        <Field label="Quantity" name="quantity" type="number" min={1} step={1} defaultValue={line?.quantity ?? 1} required />
        <Field label="Unit price (DNT)" name="unitPrice" inputMode="decimal" placeholder="1500.000" defaultValue={line ? moneyInput(line.unitPriceMillimes) : undefined} required />
      </div>
      <p className="field-hint">The invoice number is given automatically. A draft does not count in the forecast until you validate it.</p>
      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
