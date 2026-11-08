import { requireActor } from "@/lib/auth-actor";
import { useCases } from "@/container";
import Link from "next/link";
import FadeIn from "@/components/fade-in";

function formatDnt(millimes: number): string {
  const sign = millimes < 0 ? "-" : "";
  const abs = Math.abs(millimes);
  const dinars = Math.floor(abs / 1000);
  const millimesPart = String(abs % 1000).padStart(3, "0");
  const grouped = new Intl.NumberFormat("en-US").format(dinars).replace(/,/g, " ");
  return `${sign}${grouped},${millimesPart} DNT`;
}

function formatDue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}

function statusChip(status: string) {
  const colors: Record<string, [string, string]> = {
    draft: ["Draft", "#7C8F83"],
    validated: ["Validated", "#6FA8B8"],
    partially_paid: ["Partially paid", "#E3A857"],
    paid: ["Paid", "#4E8B63"],
    cancelled: ["Cancelled", "#C2452B"],
  };
  return colors[status] ?? ["Other", "#7C8F83"];
}

function isOverdue(status: string, dueDate: string, today: Date): boolean {
  return (status === "validated" || status === "partially_paid") && new Date(dueDate).getTime() < today.getTime();
}

const filterLabels: Array<[string, string | null]> = [
  ["All", null],
  ["Draft", "draft"],
  ["Validated", "validated"],
  ["Partially paid", "partially_paid"],
  ["Paid", "paid"],
];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string; filter?: string }> }) {
  const actor = await requireActor();
  const params = await searchParams;
  const status = params.status ?? null;
  const activeFilter = params.filter ?? null;

  const today = new Date();
  const all = await useCases.listInvoices.execute({ userId: actor.userId, companyId: actor.companyId });
  const parties = await useCases.listParties.execute({ userId: actor.userId, companyId: actor.companyId });
  const partyNames = new Map(parties.map((party) => [party.id, party.name]));

  const invoices = all.filter((invoice) => {
    if (activeFilter === "overdue") return isOverdue(invoice.status, invoice.dueDate, today);
    if (!status) return true;
    return invoice.status === status;
  }).map((invoice) => ({
    ...invoice,
    customerName: invoice.customerId ? partyNames.get(invoice.customerId) ?? invoice.customerId : "—",
    chips: statusChip(invoice.status),
  }));

  return (
    <FadeIn>
      <main className="shell">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 28 }}>
        <div>
          <p className="mono">Invoices</p>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>
            Receivables
          </h1>
        </div>
        <Link href="/invoices/new" style={{ textDecoration: "none" }}>
          <button type="button" style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>
            + New invoice
          </button>
        </Link>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {[...filterLabels, ["Overdue", "overdue"] as [string, string]].map(([filter, key]) => (
          <Link
            key={filter}
            href={key ? `/invoices?filter=${key}` : "/invoices"}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 999,
              border: 0,
              background: (key ?? null) === (activeFilter ?? null) ? "#1F6B4E" : "rgba(207, 224, 204, 0.7)",
              color: (key ?? null) === (activeFilter ?? null) ? "white" : "#123A2B",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {filter}
          </Link>
        ))}
      </div>

      {invoices.length === 0 && (
        <div className="glass" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "#4A6256" }}>No invoices in the database yet for this company.</p>
        </div>
      )}

      <section style={{ display: "grid", gap: 12 }}>
        {invoices.map((invoice) => (
          <Link key={invoice.id} href={`/invoices/${invoice.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <article className="glass lift" style={{ padding: 20, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: 16, alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>{invoice.number}</strong>
              <span style={{ color: "#4A6256", fontSize: 13 }}>{invoice.customerName}</span>
            </div>
            <div>
              <span className="mono">Amount</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{formatDnt(invoice.totalMillimes)}</div>
            </div>
            <div>
              <span className="mono">Remaining</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{formatDnt(invoice.remainingMillimes)}</div>
            </div>
            <div>
              <span className="mono">Due</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{formatDue(invoice.dueDate)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "6px 10px", borderRadius: 999, background: `${invoice.chips[1]}22`, color: invoice.chips[1], fontWeight: 600, fontSize: 12 }}>
                {invoice.chips[0]}
              </span>
            </div>
          </article>
          </Link>
        ))}
      </section>
    </main>
    </FadeIn>
  );
}
