import { requireActor } from "@/lib/auth-actor";
export default async function DashboardPage() {
  await requireActor();
  return (
    <main className="shell">
      <div style={{ position: "relative", minHeight: 220, marginBottom: 24 }}>
        <div className="ghost">CASH</div>
        <header style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24 }}>
          <div>
            <p className="mono">Dashboard</p>
            <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>
              Atlas Studio
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
        <div className="hero-amount" style={{ marginTop: 8 }}>5 000,000 DNT</div>
        <p style={{ color: "#4A6256", margin: "12px 0 0", maxWidth: 520 }}>
          Updated from your latest recorded movements. Forecast assumes Acme pays on time and rent is paid on the 15th.
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>
            Record payment
          </button>
          <button type="button" style={{ height: 44, padding: "0 20px", borderRadius: 999, border: "1px solid rgba(31,107,78,0.25)", background: "transparent", color: "#1F6B4E", fontWeight: 600, cursor: "pointer" }}>
            View movements
          </button>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          ["Forecast 30 days", "8 000,000 DNT", "#4E8B63", "After Acme invoice"],
          ["Forecast 60 days", "2 000,000 DNT", "#4E8B63", "After rent"],
          ["Forecast 90 days", "2 000,000 DNT", "#4E8B63", "Stable"],
          ["Alerts", "2", "#C2452B", "1 overdue, 1 pending"],
        ].map(([label, value, color, note]) => (
          <article key={label} className="glass" style={{ padding: 24 }}>
            <p className="mono">{label}</p>
            <div style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 30, lineHeight: "34px", fontWeight: 600, color, marginTop: 10 }}>
              {value}
            </div>
            <p style={{ color: "#4A6256", margin: "8px 0 0", fontSize: 13 }}>{note}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
        <article className="glass" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: 0 }}>Cash forecast</h2>
            <span className="mono">30 / 60 / 90 days</span>
          </div>
          <div style={{ height: 220, borderRadius: 20, background: "linear-gradient(180deg, rgba(31,107,78,0.08), rgba(108,245,184,0.04))", border: "1px solid rgba(207,224,204,0.8)", display: "flex", alignItems: "end", padding: 16, gap: 12 }}>
            {[45, 70, 35, 55, 80, 40, 60].map((height, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: `${height}%`,
                  borderRadius: 12,
                  background: index === 2 ? "rgba(194,69,43,0.75)" : "rgba(31,107,78,0.75)",
                }}
              />
            ))}
          </div>
          <p style={{ color: "#4A6256", margin: "16px 0 0", fontSize: 13 }}>
            Shortage periods are highlighted in clay. The simulated scenario can be compared from the forecast page.
          </p>
        </article>

        <article className="glass" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Alerts</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["Overdue invoice", "INV-001 is overdue by 3 days", "#C2452B"],
              ["Pending approval", "Software subscription waiting", "#E3A857"],
            ].map(([title, text, color]) => (
              <div key={title} style={{ padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.55)", borderLeft: `4px solid ${color}` }}>
                <strong style={{ display: "block", marginBottom: 4 }}>{title}</strong>
                <span style={{ color: "#4A6256", fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>
          <a href="/forecast" style={{ display: "inline-block", marginTop: 16, color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>
            View forecast
          </a>
        </article>
      </section>
    </main>
  );
}
