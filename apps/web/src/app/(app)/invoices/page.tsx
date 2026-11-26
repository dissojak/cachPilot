import Link from "next/link";
import { PageHeader, Card, Stat, StatusChip, EmptyState } from "@cashpilot/ui";
import type { InvoiceFilter } from "@cashpilot/application";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel } from "@/lib/format";

const filters: { label: string; value?: InvoiceFilter }[] = [
  { label: "All" },
  { label: "Draft", value: "draft" },
  { label: "Validated", value: "validated" },
  { label: "Partly paid", value: "partially_paid" },
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
  const canManage = can(actor, "invoices.manage");

  // Summary of money still to collect, from the rows shown (validated or partly paid, not cancelled).
  const open = invoices.filter((invoice) => invoice.status === "validated" || invoice.status === "partially_paid");
  const overdue = open.filter((invoice) => invoice.overdue);
  const sum = (list: { remainingMillimes: number }[]) => list.reduce((total, invoice) => total + invoice.remainingMillimes, 0);

  return (
    <main className="shell">
      <PageHeader
        title="Invoices"
        description="Money your customers owe you. Each invoice shows what is still to pay and when it is due."
        actions={canManage && <Link href="/invoices/new" className="btn">New invoice</Link>}
      />

      <div className="grid-stats">
        <Stat label="Still to collect" value={money(sum(open))} note={`${open.length} ${open.length === 1 ? "invoice" : "invoices"} awaiting payment`} />
        <Stat label="Overdue" value={money(sum(overdue))} tone={overdue.length ? "danger" : "default"} note={overdue.length ? `${overdue.length} past their due date` : "Nothing is past due"} />
      </div>

      <nav className="filters" aria-label="Filter invoices">
        {filters.map((item) => {
          const current = item.value === active;
          return (
            <Link key={item.label} href={item.value ? `/invoices?filter=${item.value}` : "/invoices"} className={`filter${current ? " active" : ""}`} aria-current={current ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Card>
        {invoices.length === 0
          ? (
            <EmptyState
              title={active ? "No invoice with this status" : "No invoice yet"}
              text={active ? "Try another filter to see the other invoices." : "Create a draft, validate it, and its amount shows in the forecast on the due date."}
              action={canManage && !active ? <Link href="/invoices/new" className="btn">Create an invoice</Link> : undefined}
            />
          )
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Due</th>
                    <th className="num">Total</th>
                    <th className="num">Still to pay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><Link href={`/invoices/${invoice.id}`} className="table-main">{invoice.number}</Link></td>
                      <td className="muted">{names.get(invoice.customerId) ?? "Unknown customer"}</td>
                      <td className={invoice.overdue ? "amount-out" : undefined}>{date(invoice.dueDate)}</td>
                      <td className="num">{money(invoice.totalMillimes)}</td>
                      <td className="num">{money(invoice.remainingMillimes)}</td>
                      <td>
                        <span className="chip-row">
                          {invoice.overdue && <StatusChip status="overdue" label="Overdue" />}
                          <StatusChip status={invoice.status} label={statusLabel[invoice.status] ?? invoice.status} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </main>
  );
}
