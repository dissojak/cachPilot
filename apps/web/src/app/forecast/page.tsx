import Link from "next/link";
const points = [
  { label: "Now", value: 5000, color: "#1F6B4E" },
  { label: "30d", value: 8000, color: "#4E8B63" },
  { label: "60d", value: 2000, color: "#4E8B63" },
  { label: "90d", value: 2000, color: "#4E8B63" },
];

export default function ForecastPage() {
  const max = 9000;

  return (
    <main className="shell">
      <header style={{ marginBottom: 28 }}>
        <p className="mono">Forecast</p>
        <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>
          Cash projection
        </h1>
        <p style={{ color: "#4A6256", maxWidth: 620, margin: "12px 0 0", lineHeight: 1.5 }}>
          Based on real balance, remaining invoice amounts by due date, and approved unpaid expenses.
        </p>
      </header>

      <section className="glass" style={{ padding: 32, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: 0 }}>30 / 60 / 90 days</h2>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#4A6256" }}>
            <span><span style={{ color: "#1F6B4E", fontWeight: 700 }}>■</span> Base</span>
            <span><span style={{ color: "#6CF5B8", fontWeight: 700 }}>■</span> Simulated</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "end", height: 260 }}>
          {points.map((point) => (
            <div key={point.label} style={{ display: "grid", gap: 10, alignItems: "end", height: "100%" }}>
              <div style={{ height: `${(point.value / max) * 100}%`, borderRadius: 16, background: `linear-gradient(180deg, ${point.color}, rgba(31,107,78,0.35))`, minHeight: 24 }} />
              <div style={{ textAlign: "center" }}>
                <strong style={{ display: "block" }}>{point.value.toLocaleString("en-US")} DNT</strong>
                <span className="mono">{point.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <article className="glass" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 12px" }}>Assumptions</h2>
          <ul style={{ color: "#4A6256", lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
            <li>Reference balance includes movements up to today.</li>
            <li>Expected receipts use remaining invoice amounts.</li>
            <li>Planned expenses use approved, unpaid expenses.</li>
            <li>Overdue invoices remain in all future horizons.</li>
          </ul>
        </article>
        <article className="glass" style={{ padding: 28, borderLeft: "4px solid #C2452B" }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 12px" }}>Shortage window</h2>
          <p style={{ color: "#4A6256", margin: 0, lineHeight: 1.6 }}>
            No negative balance in the base scenario. Simulate a 20-day client delay to see the shortage appear around 15 Nov.
          </p>
          <Link href="/simulations" style={{ display: "inline-block", marginTop: 16, color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>
            Run simulation
          </Link>
        </article>
      </section>
    </main>
  );
}
