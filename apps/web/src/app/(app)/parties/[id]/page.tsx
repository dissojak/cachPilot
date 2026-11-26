import Link from "next/link";
import { PageHeader, Card, Stat, EmptyState, StatusChip } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel } from "@/lib/format";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { updatePartyAction } from "../actions";

const methodLabel: Record<string, string> = {
  bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque", card: "Card",
};

export default async function PartyPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("parties.view");
  const { id } = await params;
  const history = await useCases.getPartyHistory.execute({ ...actor, partyId: id });
  const { party } = history;
  const canManage = can(actor, "parties.manage");
  const billable = history.invoices.filter((invoice) => invoice.status !== "cancelled");
  const billed = billable.reduce((sum, invoice) => sum + invoice.totalMillimes, 0);
  const received = history.payments.reduce((sum, payment) => sum + payment.amountMillimes, 0);
  const stillToPay = billable.reduce((sum, invoice) => sum + invoice.remainingMillimes, 0);

  return (
    <main className="shell">
      <PageHeader title={party.name}
        description={party.type === "customer" ? "Customer. Its invoices and the payments received are listed below." : "Supplier. Contact details and history are kept here."} />

      <div className="grid-stats">
        <Stat label="Invoiced" value={money(billed)} note="Excluding cancelled invoices" />
        <Stat label="Received" value={money(received)} tone="success" note={`${history.payments.length} ${history.payments.length === 1 ? "payment" : "payments"}`} />
        <Stat label="Still to receive" value={money(stillToPay)} tone={stillToPay > 0 ? "danger" : "default"} note={stillToPay > 0 ? "Open invoices" : "Nothing outstanding"} />
      </div>

      <div className="grid-2">
        <div className="stack">
          <Card title="Invoices">
            {history.invoices.length === 0
              ? <EmptyState title="No invoice yet" text="Invoices issued to this customer appear here." action={canManage && party.type === "customer" ? <Link href="/invoices/new" className="btn btn-small">New invoice</Link> : undefined} />
              : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Number</th><th>Due</th><th className="num">Total</th><th className="num">Still to pay</th><th>Status</th></tr></thead>
                    <tbody>{history.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td><Link href={`/invoices/${invoice.id}`} className="table-main">{invoice.number}</Link></td>
                        <td>{date(invoice.dueDate)}</td>
                        <td className="num">{money(invoice.totalMillimes)}</td>
                        <td className="num">{money(invoice.remainingMillimes)}</td>
                        <td><StatusChip status={invoice.status} label={statusLabel[invoice.status] ?? invoice.status} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
          </Card>
          <Card title="Payments">
            {history.payments.length === 0
              ? <EmptyState title="No payment yet" text="Payments received from this customer appear here." />
              : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Method</th><th className="num">Amount</th></tr></thead>
                    <tbody>{history.payments.map((payment) => (
                      <tr key={payment.id}><td>{date(payment.paymentDate)}</td><td>{methodLabel[payment.method] ?? payment.method}</td><td className="num amount-in">{money(payment.amountMillimes)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
          </Card>
        </div>

        {canManage && (
          <Card title="Contact details">
            <ActionForm action={updatePartyAction} className="form">
              <input type="hidden" name="partyId" value={party.id} />
              <SelectField label="Type" name="type" defaultValue={party.type} options={[{ value: "customer", label: "Customer" }, { value: "supplier", label: "Supplier" }]} />
              <Field label="Name" name="name" defaultValue={party.name} required />
              <Field label="E-mail" name="email" type="email" defaultValue={party.email} />
              <Field label="Phone" name="phone" type="tel" defaultValue={party.phone} />
              <Field label="Address" name="address" defaultValue={party.address} />
              <div className="form-footer"><SubmitButton>Save contact</SubmitButton></div>
            </ActionForm>
          </Card>
        )}
      </div>
    </main>
  );
}
