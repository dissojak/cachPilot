import Link from "next/link";
import { randomUUID } from "node:crypto";
import { PageHeader, Card, StatusChip, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel, moneyInput } from "@/lib/format";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { validateInvoiceAction, cancelInvoiceAction, recordPaymentAction } from "../actions";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("invoices.view");
  const { id } = await params;
  const [invoice, payments, parties] = await Promise.all([
    useCases.getInvoice.execute({ ...actor, invoiceId: id }),
    useCases.listPaymentsForInvoice.execute({ ...actor, invoiceId: id }),
    useCases.listParties.execute(actor),
  ]);
  const customer = parties.find((party) => party.id === invoice.customerId);
  const manage = can(actor, "invoices.manage");
  const payable = can(actor, "payments.record") && (invoice.status === "validated" || invoice.status === "partially_paid");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="shell">
      <PageHeader eyebrow="Invoice" title={invoice.number}
        description={`${customer?.name ?? "Unknown customer"} · issued ${date(invoice.issueDate)} · due ${date(invoice.dueDate)}`}
        actions={<>
          {invoice.overdue && <StatusChip status="overdue" label="Overdue" />}
          <StatusChip status={invoice.status} label={statusLabel[invoice.status] ?? invoice.status} />
          {can(actor, "invoices.export") && <a href={`/api/invoices/${invoice.id}/pdf`} className="btn btn-secondary btn-small">Download PDF</a>}
        </>} />

      <div className="grid-2">
        <div className="stack">
          <Card title="Lines">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {invoice.lines.map((line, index) => (
                    <tr key={index}><td>{line.description}</td><td className="num">{line.quantity}</td><td className="num">{money(line.unitPriceMillimes)}</td><td className="num">{money(line.lineTotalMillimes)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="kv" style={{ marginTop: 18 }}>
              <dt>Total</dt><dd>{money(invoice.totalMillimes)}</dd>
              <dt>Paid</dt><dd className="amount-in">{money(invoice.totalMillimes - invoice.remainingMillimes)}</dd>
              <dt>Remaining</dt><dd>{money(invoice.remainingMillimes)}</dd>
              {invoice.cancelledReason && (<><dt>Cancelled</dt><dd>{invoice.cancelledReason}</dd></>)}
            </dl>
          </Card>

          <Card title="Payments received">
            {payments.length === 0
              ? <EmptyState title="No payment yet" text="Each payment reduces the remaining amount and adds one cash movement." />
              : (
                <table className="table">
                  <thead><tr><th>Date</th><th>Method</th><th className="num">Amount</th></tr></thead>
                  <tbody>{payments.map((payment) => (
                    <tr key={payment.id}><td>{date(payment.paymentDate)}</td><td>{payment.method.replace("_", " ")}</td><td className="num amount-in">{money(payment.amountMillimes)}</td></tr>
                  ))}</tbody>
                </table>
              )}
          </Card>
        </div>

        <div className="stack">
          {manage && invoice.status === "draft" && (
            <Card title="Draft">
              <p className="muted">A draft is not in the forecast yet. Validate it to make it official.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <ActionForm action={validateInvoiceAction} className="inline-form">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <SubmitButton>Validate invoice</SubmitButton>
                </ActionForm>
                <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-secondary">Edit</Link>
              </div>
            </Card>
          )}

          {payable && (
            <Card title="Record a payment">
              <ActionForm action={recordPaymentAction} resetOnSuccess>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                {/* D5: a fresh id per page render; submitting the same form twice is rejected */}
                <input type="hidden" name="operationId" value={randomUUID()} />
                <Field label="Amount (DNT)" name="amount" inputMode="decimal" defaultValue={moneyInput(invoice.remainingMillimes)} hint={`At most ${money(invoice.remainingMillimes)}`} required />
                <div className="form-row">
                  <Field label="Date received" name="paymentDate" type="date" defaultValue={today} max={today} required />
                  <SelectField label="Method" name="method" options={[
                    { value: "bank_transfer", label: "Bank transfer" }, { value: "cash", label: "Cash" },
                    { value: "cheque", label: "Cheque" }, { value: "card", label: "Card" },
                  ]} />
                </div>
                <Field label="Note (optional)" name="note" />
                <SubmitButton>Record payment</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {manage && (invoice.status === "draft" || invoice.status === "validated") && (
            <Card title="Cancel this invoice">
              <p className="muted">Allowed only while no payment is recorded. The invoice is kept, marked cancelled.</p>
              <ActionForm action={cancelInvoiceAction}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <Field label="Reason" name="reason" required />
                <SubmitButton variant="danger">Cancel invoice</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
