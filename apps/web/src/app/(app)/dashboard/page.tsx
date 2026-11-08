import { requireActor } from "@/lib/auth-actor";
import { useCases } from "@/container";
import FadeIn from "@/components/fade-in";
import AnimatedBars from "@/components/animated-bars";

function formatDnt(millimes: number): string {
  const sign = millimes < 0 ? "-" : "";
  const abs = Math.abs(millimes);
  const dinars = Math.floor(abs / 1000);
  const millimesPart = String(abs % 1000).padStart(3, "0");
  const grouped = new Intl.NumberFormat("en-US").format(dinars).replace(/,/g, " ");
  return `${sign}${grouped},${millimesPart} DNT`;
}

const alertColor: Record<string, string> = {
  invoice_overdue: "#C2452B",
  expense_pending_approval: "#E3A857",
  negative_forecast: "#C2452B",
};

const alertTarget: Record<string, string> = {
  invoice_overdue: "/invoices",
  expense_pending_approval: "/expenses",
  negative_forecast: "/forecast",
};

export default async function DashboardPage() {
  const actor = await requireActor();
  const data = await useCases.getDashboard.execute({ userId: actor.userId, companyId: actor.companyId });

  const company = data.company;
  const points = data.forecast.points;
  const today = points[0];
  const baseDate = today?.date ?? new Date().toISOString().slice(0, 10);
  const thirty = points.find((point) => new Date(point.date).getTime() - new Date(baseDate).getTime() >= 29 * 864e5) ?? today;
  const sixty = points.find((point) => new Date(point.date).getTime() - new Date(baseDate).getTime() >= 59 * 864e5) ?? thirty;
  const ninety = points[points.length - 1];

  const balances = points.map((point) => point.balanceMillimes);
  const max = Math.max(...balances, 1);
  const min = Math.min(...balances, 0);
  const range = Math.max(max - min, 1);
  const heights = balances.map((value) => 25 + Math.round(((value - min) / range) * 75));
  const worstIndex = balances.indexOf(Math.min(...balances));

  const cards: Array<[string, string, string, string]> = [
    ["Forecast 30 days", formatDnt(thirty?.balanceMillimes ?? 0), "#4E8B63", "Projection from due invoices and expenses"],
    ["Forecast 60 days", formatDnt(sixty?.balanceMillimes ?? 0), "#4E8B63", "Projection from your ledger"],
    ["Forecast 90 days", formatDnt(ninety?.balanceMillimes ?? 0), "#4E8B63", "Projection from your ledger"],
    ["Alerts", String(data.alerts.length), data.alerts.length ? "#C2452B" : "#4E8B63", data.alerts.length ? data.alerts.slice(0, 2).map((alert) => alert.message).join(" · ") : "Nothing pending — all clear"],
  ];

  return (
    <FadeIn>
      <main className="shell">
      <div style={{ position: "relative", minHeight: 220, marginBottom: 24 }}>
        <div className="ghost">CASH</div>
        <header style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24 }}>
          <div>
            <p className="mono">Dashboard</p>
            <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>
              {company.name}
            </h1>
          </div>
          <div className="glass" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A6256" }}>
              Horizon
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {["30", "60", "90"].map((day, index) => (
                <button
                  key={day}
                  type="button"
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: 0,
                    background: index === 0 ? "#1F6B4E" : "rgba(207, 224, 204, 0.7)",
                    color: index === 0 ? "white" : "#123A2B",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {day}d
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>

      <section className="glass" style={{ padding: 40, marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(108, 245, 184, 0.18)", filter: "blur(10px)" }} />
        <p className="mono">Real balance</p>
        <div className="hero-amount" style={{ marginTop: 8 }}>{formatDnt(data.realBalanceMillimes)}</div>
        <p style={{ color: "#4A6256", margin: "12px 0 0", maxWidth: 520 }}>
          Computed from your opening balance and every recorded cash movement in the database on {String(today?.date ?? "").slice(0, 10)}.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {cards.map(([label, value, color, note], index) => (
          <FadeIn key={label} delay={0.15 + index * 0.08}>
          <article className="glass lift" style={{ padding: 24 }}>
            <p className="mono">{label}</p>
            <div style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 30, lineHeight: "34px", fontWeight: 600, color, marginTop: 10 }}>
              {value}
            </div>
            <p style={{ color: "#4A6256", margin: "8px 0 0", fontSize: 13 }}>{note}</p>
          </article>
          </FadeIn>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
        <article className="glass" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: 0 }}>Cash forecast</h2>
            <span className="mono">today / 30 / 60 / 90</span>
          </div>
          <AnimatedBars heights={heights} highlightIndex={worstIndex} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {points.map((point) => (
              <span key={point.date} style={{ flex: 1, textAlign: "center", color: "#4A6256", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                {String(point.date).slice(0, 10)}
              </span>
            ))}
          </div>
          <p style={{ color: "#4A6256", margin: "12px 0 0", fontSize: 13 }}>
            {heights.length} live projection points from your invoices and expenses. Lowest projection ({formatDnt(Math.min(...balances))}) is highlighted in clay.
          </p>
        </article>

        <article className="glass" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Alerts</h2>
          {data.alerts.length === 0 && (
            <p style={{ color: "#4A6256" }}>No alerts. Invoices are paid on time, expenses are processed and the forecast stays positive.</p>
          )}
          <div style={{ display: "grid", gap: 12 }}>
            {data.alerts.slice(0, 4).map((alert) => (
              <a key={`${alert.type}-${alert.entityId}`} href={alertTarget[alert.type] ?? "#"} style={{ textDecoration: "none", color: "inherit", padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.55)", borderLeft: `4px solid ${alertColor[alert.type] ?? "#E3A857"}` }}>
                <strong style={{ display: "block", marginBottom: 4 }}>{alert.type.replace(/_/g, " ")}</strong>
                <span style={{ color: "#4A6256", fontSize: 13 }}>{alert.message}</span>
              </a>
            ))}
          </div>
          <a href="/cash" style={{ display: "inline-block", marginTop: 16, color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>
            View movements
          </a>
        </article>
      </section>
    </main>
    </FadeIn>
  );
}
