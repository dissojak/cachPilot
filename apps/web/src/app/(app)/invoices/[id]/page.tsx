import Link from "next/link";
import { randomUUID } from "node:crypto";
import { PageHeader, Card, StatusChip, StepTrail, AmountProgress, EmptyState, type Step } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel, moneyInput } from "@/lib/format";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { validateInvoiceAction, cancelInvoiceAction, recordPaymentAction } from "../actions";

const methodLabel: Record<string, string> = {
  bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque", card: "Card",
};

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
  const paidMillimes = invoice.totalMillimes - invoice.remainingMillimes;
  const paidPercent = invoice.totalMillimes > 0 ? Math.round((paidMillimes * 100) / invoice.totalMillimes) : 0;
  const status = invoice.status;

  const steps: Step[] = status === "cancelled"
    ? [
      { label: "Draft", detail: "Created", state: "done" },
      { label: "Cancelled", detail: invoice.cancelledReason, state: "danger" },
    ]
    : [
      { label: "Draft", detail: status === "draft" ? "Not in the forecast yet" : "Created", state: status === "draft" ? "current" : "done" },
      { label: "Validated", detail: status === "validated" ? "Waiting for payment" : status === "draft" ? "Makes it official" : "In the forecast", state: status === "draft" ? "todo" : status === "validated" ? "current" : "done" },
      { label: status === "partially_paid" ? "Partly paid" : "Paid", detail: status === "paid" ? "Settled in full" : `${paidPercent}% received`, state: status === "paid" ? "done" : status === "partially_paid" ? "current" : "todo" },
    ];

  return (
    <main className="shell">
      <PageHeader title={invoice.number}
        description={`${customer?.name ?? "Unknown customer"} · issued ${date(invoice.issueDate)} · due ${date(invoice.dueDate)}`}
        actions={<>
          {invoice.overdue && <StatusChip status="overdue" label="Overdue" />}
          <StatusChip status={status} label={statusLabel[status] ?? status} />
          {can(actor, "invoices.export") && <a href={`/api/invoices/${invoice.id}/pdf`} className="btn btn-secondary btn-small">Download PDF</a>}
        </>} />

      <Card>
        <StepTrail steps={steps} label="Invoice progress" />
        <div className="mt-24">
          <AmountProgress value={paidMillimes} max={invoice.totalMillimes} label={`${paidPercent}% of ${invoice.number} received`} />
          <dl className="money-strip">
            <div><dt>Total</dt><dd>{money(invoice.totalMillimes)}</dd></div>
            <div><dt>Received</dt><dd className="amount-in">{money(paidMillimes)}</dd></div>
            <div><dt>Still to pay</dt><dd className={invoice.remainingMillimes > 0 ? "is-open" : "amount-in"}>{money(invoice.remainingMillimes)}</dd></div>
          </dl>
        </div>
      </Card>

      <div className="grid-2 mt-24">
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
          </Card>

          <Card title="Payments received">
            {payments.length === 0
              ? <EmptyState title="No payment yet" text="Each payment lowers the amount still to pay and adds one cash movement." />
              : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Method</th><th className="num">Amount</th></tr></thead>
                    <tbody>{payments.map((payment) => (
                      <tr key={payment.id}><td>{date(payment.paymentDate)}</td><td>{methodLabel[payment.method] ?? payment.method}</td><td className="num amount-in">{money(payment.amountMillimes)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
          </Card>
        </div>

        <div className="stack">
          {manage && status === "draft" && (
            <Card title="Next step">
              <p className="decision-note muted">A draft is not in the forecast yet. Validating makes it official and adds it to the forecast.</p>
              <div className="actions-row">
                <ActionForm action={validateInvoiceAction} className="inline-form">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <SubmitButton>Validate invoice</SubmitButton>
                </ActionForm>
                <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-secondary">Edit draft</Link>
              </div>
            </Card>
          )}

          {payable && (
            <Card title="Record a payment">
              <p className="decision-note muted">You can receive up to {money(invoice.remainingMillimes)} on this invoice.</p>
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

          {status === "cancelled" && (
            <Card title="Cancelled">
              <p className="muted">This invoice is kept for the record and no longer counts in the forecast.</p>
            </Card>
          )}

          {manage && (status === "draft" || status === "validated") && (
            <Card title="Cancel this invoice" className="danger-zone">
              <p className="decision-note muted">Allowed only while no payment is recorded. The invoice is kept, marked cancelled.</p>
              <ActionForm action={cancelInvoiceAction}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <Field label="Reason" name="reason" hint="Required. It stays on this invoice." required />
                <SubmitButton variant="danger">Cancel invoice</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
