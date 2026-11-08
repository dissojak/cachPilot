import { useCases } from "@/container";
import { requireActor } from "@/lib/auth-actor";
import { date } from "@/lib/format";
import Link from "next/link";
import { createScenarioAction, addHypothesisAction } from "@/app/actions";

export default async function SimulationsPage() {
  const actor = await requireActor();
  const scenarios = await useCases.listScenarios.execute({ userId: actor.userId, companyId: actor.companyId });

  return (
    <main className="shell motion-fade">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 24 }}>
        <div>
          <p className="mono">Simulations</p>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>What-if scenarios</h1>
        </div>
      </header>

      <section className="glass motion-slide" style={{ padding: 24, marginBottom: 24 }}>
        <form action={createScenarioAction} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <input name="name" placeholder="Scenario name" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <input name="baseReferenceDate" type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <button type="submit" style={{ height: 48, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Create scenario</button>
        </form>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="glass lift motion-pop" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>{scenario.name}</strong>
              <span style={{ color: "#4A6256", fontSize: 13 }}>Base date {date(scenario.baseReferenceDate)} · {scenario.hypotheses.length} hypotheses</span>
            </div>
            <Link href={`/simulations/${scenario.id}`} style={{ color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>Run</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
