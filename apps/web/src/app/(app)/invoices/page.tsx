import Link from "next/link";
import { PageHeader, StatusChip, EmptyState } from "@cashpilot/ui";
import type { InvoiceFilter } from "@cashpilot/application";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel } from "@/lib/format";

const filters: { label: string; value?: InvoiceFilter }[] = [
  { label: "All" },
  { label: "Draft", value: "draft" },
  { label: "Validated", value: "validated" },
  { label: "Partially paid", value: "partially_paid" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const actor = await requirePermission("invoices.view");
  const { filter } = await searchParams;
  const active = filters.find((item) => item.value === filter)?.value;
  const [invoices, parties] = await Promise.all([
    useCases.listInvoices.execute({ ...actor, filter: active }),
    useCases.listParties.execute(actor),
  ]);
  const names = new Map(parties.map((party) => [party.id, party.name]));

  return (
    <main className="shell">
      <PageHeader eyebrow="Invoices" title="Receivables" actions={can(actor, "invoices.manage") && <Link href="/invoices/new" className="btn">+ New invoice</Link>} />
      <nav className="filters" aria-label="Filter invoices">
        {filters.map((item) => (
          <Link key={item.label} href={item.value ? `/invoices?filter=${item.value}` : "/invoices"} className={`filter ${item.value === active ? "active" : ""}`} aria-current={item.value === active ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      {invoices.length === 0 ? (
        <section className="glass">
          <EmptyState title="No invoice here" text={active ? "No invoice matches this filter." : "Create your first invoice to see expected receipts in the forecast."}
            action={can(actor, "invoices.manage") && !active ? <Link href="/invoices/new" className="btn">Create an invoice</Link> : undefined} />
        </section>
      ) : (
        <div className="list">
          {invoices.map((invoice) => (
            <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="glass lift row">
              <div><strong>{invoice.number}</strong><small>{names.get(invoice.customerId) ?? "Unknown customer"}</small></div>
              <div><small>Total</small><strong>{money(invoice.totalMillimes)}</strong></div>
              <div><small>Remaining · due {date(invoice.dueDate)}</small><strong>{money(invoice.remainingMillimes)}</strong></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {invoice.overdue && <StatusChip status="overdue" label="Overdue" />}
                <StatusChip status={invoice.status} label={statusLabel[invoice.status] ?? invoice.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
