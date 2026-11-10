import Link from "next/link";
import { PageHeader, Card, EmptyState, StatusChip } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel } from "@/lib/format";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { updatePartyAction } from "../actions";

export default async function PartyPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("parties.view");
  const { id } = await params;
  const history = await useCases.getPartyHistory.execute({ ...actor, partyId: id });
  const { party } = history;
  const billed = history.invoices.filter((invoice) => invoice.status !== "cancelled").reduce((sum, invoice) => sum + invoice.totalMillimes, 0);
  const received = history.payments.reduce((sum, payment) => sum + payment.amountMillimes, 0);

  return (
    <main className="shell">
      <PageHeader eyebrow={party.type === "customer" ? "Customer" : "Supplier"} title={party.name}
        description={`Billed ${money(billed)} · received ${money(received)}`} />
      <div className="grid-2">
        <div className="stack">
          <Card title="Invoices">
            {history.invoices.length === 0 ? <EmptyState title="No invoice" text="Invoices for this customer appear here." /> : (
              <table className="table">
                <thead><tr><th>Number</th><th>Due</th><th className="num">Total</th><th className="num">Remaining</th><th /></tr></thead>
                <tbody>{history.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><Link href={`/invoices/${invoice.id}`}>{invoice.number}</Link></td>
                    <td>{date(invoice.dueDate)}</td>
                    <td className="num">{money(invoice.totalMillimes)}</td>
                    <td className="num">{money(invoice.remainingMillimes)}</td>
                    <td><StatusChip status={invoice.status} label={statusLabel[invoice.status] ?? invoice.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </Card>
          <Card title="Payments">
            {history.payments.length === 0 ? <EmptyState title="No payment" text="Payments received from this customer appear here." /> : (
              <table className="table">
                <thead><tr><th>Date</th><th>Method</th><th className="num">Amount</th></tr></thead>
                <tbody>{history.payments.map((payment) => (
                  <tr key={payment.id}><td>{date(payment.paymentDate)}</td><td>{payment.method.replace("_", " ")}</td><td className="num amount-in">{money(payment.amountMillimes)}</td></tr>
                ))}</tbody>
              </table>
            )}
          </Card>
        </div>
        {can(actor, "parties.manage") && (
          <Card title="Contact details">
            <ActionForm action={updatePartyAction}>
              <input type="hidden" name="partyId" value={party.id} />
              <SelectField label="Type" name="type" defaultValue={party.type} options={[{ value: "customer", label: "Customer" }, { value: "supplier", label: "Supplier" }]} />
              <Field label="Name" name="name" defaultValue={party.name} required />
              <Field label="E-mail" name="email" type="email" defaultValue={party.email} />
              <Field label="Phone" name="phone" type="tel" defaultValue={party.phone} />
              <Field label="Address" name="address" defaultValue={party.address} />
              <SubmitButton>Save</SubmitButton>
            </ActionForm>
          </Card>
        )}
      </div>
    </main>
  );
}
