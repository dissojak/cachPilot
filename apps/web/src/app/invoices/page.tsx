import { requireActor } from "@/lib/auth-actor";
const invoices = [
  { number: "INV-001", customer: "Acme Client", amount: "3 000,000 DNT", remaining: "2 000,000 DNT", due: "10 Nov", status: "Partially paid", color: "#E3A857" },
  { number: "INV-002", customer: "Globex Corp", amount: "4 500,000 DNT", remaining: "4 500,000 DNT", due: "25 Nov", status: "Validated", color: "#6FA8B8" },
  { number: "INV-003", customer: "Acme Client", amount: "1 200,000 DNT", remaining: "1 200,000 DNT", due: "—", status: "Draft", color: "#7C8F83" },
];

export default async function InvoicesPage() {
  await requireActor();
  return (
    <main className="shell">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 28 }}>
        <div>
          <p className="mono">Invoices</p>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>
            Receivables
          </h1>
        </div>
        <button type="button" style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>
          + New invoice
        </button>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["All", "Draft", "Sent", "Overdue", "Paid"].map((filter, index) => (
          <button
            key={filter}
            type="button"
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 999,
              border: 0,
              background: index === 0 ? "#1F6B4E" : "rgba(207, 224, 204, 0.7)",
              color: index === 0 ? "white" : "#123A2B",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <section style={{ display: "grid", gap: 12 }}>
        {invoices.map((invoice) => (
          <article key={invoice.number} className="glass" style={{ padding: 20, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: 16, alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>{invoice.number}</strong>
              <span style={{ color: "#4A6256", fontSize: 13 }}>{invoice.customer}</span>
            </div>
            <div>
              <span className="mono">Amount</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{invoice.amount}</div>
            </div>
            <div>
              <span className="mono">Remaining</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{invoice.remaining}</div>
            </div>
            <div>
              <span className="mono">Due</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{invoice.due}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "6px 10px", borderRadius: 999, background: `${invoice.color}22`, color: invoice.color, fontWeight: 600, fontSize: 12 }}>
                {invoice.status}
              </span>
              <button type="button" style={{ height: 36, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(31,107,78,0.25)", background: "transparent", color: "#1F6B4E", fontWeight: 600, cursor: "pointer" }}>
                View
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
