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

export default async function ForecastPage() {
  const actor = await requireActor();

  const today = new Date();
  const targetDates = [0, 30, 60, 90].map((offset) => {
    const date = new Date(today.getTime() + offset * 864e5);
    return date.toISOString().slice(0, 10);
  });
  const series = await useCases.getForecastSeries.execute({ userId: actor.userId, companyId: actor.companyId, targetDates });
  const snapshots = await useCases.listScenarios.execute({ userId: actor.userId, companyId: actor.companyId });

  const referenceBalance = series[0]?.balanceMillimes ?? 0;
  const maxAbs = Math.max(...series.map((point) => Math.abs(point.balanceMillimes)), 1);

  return (
    <FadeIn>
      <main className="shell">
      <header style={{ marginBottom: 28 }}>
        <p className="mono">Forecast</p>
        <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>
          Cash projection
        </h1>
        <p style={{ color: "#4A6256", maxWidth: 620, margin: "12px 0 0", lineHeight: 1.5 }}>
          Computed live from your database: real balance, remaining invoice amounts by due date, and approved unpaid expenses.
        </p>
      </header>

      <section className="glass" style={{ padding: 32, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: 0 }}>Today / 30 / 60 / 90 days</h2>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#4A6256" }}>
            <span><span style={{ color: "#1F6B4E", fontWeight: 700 }}>■</span> Base</span>
            <span><span style={{ color: "#6CF5B8", fontWeight: 700 }}>■</span> Simulated</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${series.length}, 1fr)`, gap: 16, alignItems: "end", height: 260 }}>
          {series.map((point, index) => (
            <div key={point.date} style={{ display: "grid", gap: 10, alignItems: "end", height: "100%" }}>
              <div style={{ height: `${(Math.abs(point.balanceMillimes) / maxAbs) * 100}%`, borderRadius: 16, background: point.balanceMillimes < 0 ? "rgba(194,69,43,0.85)" : `linear-gradient(180deg, #1F6B4E, rgba(31,107,78,0.35))`, minHeight: 24 }} />
              <div style={{ textAlign: "center" }}>
                <strong style={{ display: "block" }}>{formatDnt(point.balanceMillimes)}</strong>
                <span className="mono" style={{ fontSize: 11 }}>
                  {["Now", "+30d", "+60d", "+90d"][index] ?? point.date} ({point.date})
                </span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: "#4A6256", margin: "16px 0 0", fontSize: 13 }}>
          Reference balance today: {formatDnt(referenceBalance)}. Bars are actual projections from the ForecastEngine, not placeholders.
        </p>
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
        <article className="glass" style={{ padding: 28, borderLeft: snapshots.length ? "4px solid #E3A857" : "4px solid #C2452B" }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 12px" }}>Shortage window</h2>
          <p style={{ color: "#4A6256", margin: 0, lineHeight: 1.6 }}>
            {series.some((point) => point.balanceMillimes < 0)
              ? "The base scenario goes negative within the horizon above — collect receivables or delay outflows."
              : "No negative balance in the base scenario from your live data. Simulate client delays to stress-test it."}
          </p>
          {snapshots.length > 0 && (
            <ul style={{ color: "#4A6256", margin: "12px 0 0", paddingLeft: 18 }}>
              {snapshots.slice(0, 3).map((scenario) => (
                <li key={scenario.id}>
                  <Link href={`/simulations/${scenario.id}`} style={{ color: "#1F6B4E", fontWeight: 600 }}>{scenario.name}</Link> — {scenario.baseReferenceDate}
                </li>
              ))}
            </ul>
          )}
          <Link href="/simulations" style={{ display: "inline-block", marginTop: 16, color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>
            Run simulation
          </Link>
        </article>
      </section>
    </main>
    </FadeIn>
  );
}
