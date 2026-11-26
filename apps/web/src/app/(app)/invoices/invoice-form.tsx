import Link from "next/link";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { moneyInput } from "@/lib/format";
import type { ActionResult } from "@/lib/action";

type Customer = { id: string; name: string };
type Draft = { id: string; customerId: string; issueDate: string; dueDate: string; lines: { description: string; quantity: number; unitPriceMillimes: number }[] };

/** Shared by "new" and "edit": one line per invoice keeps the form simple. */
export function InvoiceForm({ action, customers, draft, submitLabel, cancelHref }: {
  action: (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  customers: Customer[];
  draft?: Draft;
  submitLabel: string;
  cancelHref: string;
}) {
  if (customers.length === 0) {
    return (
      <div className="empty-state">
        <strong>Add a customer first</strong>
        <p className="muted">An invoice is always issued to a customer.</p>
        <Link href="/parties" className="btn btn-secondary btn-small">Go to customers</Link>
      </div>
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  const line = draft?.lines[0];
  return (
    <ActionForm action={action} className="form">
      {draft && <input type="hidden" name="invoiceId" value={draft.id} />}
      <SelectField label="Customer" name="customerId" defaultValue={draft?.customerId} options={customers.map((customer) => ({ value: customer.id, label: customer.name }))} />
      <div className="form-row">
        <Field label="Issue date" name="issueDate" type="date" defaultValue={draft?.issueDate ?? today} required />
        <Field label="Due date" name="dueDate" type="date" defaultValue={draft?.dueDate} required />
      </div>
      <Field label="What you are billing for" name="description" defaultValue={line?.description} placeholder="Website redesign, phase 1" required />
      <div className="form-row">
        <Field label="Quantity" name="quantity" type="number" min={1} step={1} defaultValue={line?.quantity ?? 1} required />
        <Field label="Unit price (DNT)" name="unitPrice" inputMode="decimal" placeholder="1500.000" defaultValue={line ? moneyInput(line.unitPriceMillimes) : undefined} required />
      </div>
      <p className="field-hint">The invoice number is given automatically. A draft is not in the forecast until you validate it.</p>
      <div className="form-footer">
        <Link href={cancelHref} className="btn btn-secondary">Cancel</Link>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
