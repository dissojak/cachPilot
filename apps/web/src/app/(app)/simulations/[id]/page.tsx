import { useCases } from "@/container";
import { requireActor } from "@/lib/auth-actor";
import { date } from "@/lib/format";
import Link from "next/link";
import { addHypothesisAction } from "@/app/actions";
import FadeIn from "@/components/fade-in";

export default async function SimulationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const scenario = await useCases.getScenario.execute({ userId: actor.userId, companyId: actor.companyId, scenarioId: id });
  const result = await useCases.runSimulation.execute({ userId: actor.userId, companyId: actor.companyId, scenarioId: id });

  return (
    <FadeIn>
      <main className="shell motion-fade">
      <header style={{ marginBottom: 24 }}>
        <Link href="/simulations" style={{ color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>← Simulations</Link>
        <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "12px 0 0" }}>{scenario.name}</h1>
        <p style={{ color: "#4A6256", margin: "8px 0 0" }}>Base date {date(scenario.baseReferenceDate)}</p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <article className="glass motion-slide" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 12px" }}>Add hypothesis</h2>
          <form action={addHypothesisAction} style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <select name="type" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 12px" }}>
              <option value="client_delay">Client delay</option>
              <option value="new_expense">New expense</option>
              <option value="extra_income">Extra income</option>
            </select>
            <input name="invoiceId" placeholder="Invoice id for delay" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="delayDays" type="number" placeholder="Delay days" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="amountMillimes" type="number" placeholder="Amount in millimes" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="plannedDate" type="date" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="expectedDate" type="date" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="category" placeholder="Category" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="description" placeholder="Description" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <button type="submit" style={{ height: 44, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Add hypothesis</button>
          </form>
        </article>

        <article className="glass motion-slide" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 12px" }}>Hypotheses</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {scenario.hypotheses.map((hypothesis, index) => (
              <div key={index} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.5)" }}>
                <strong style={{ display: "block", marginBottom: 4 }}>{hypothesis.type}</strong>
                <span style={{ color: "#4A6256", fontSize: 13 }}>{JSON.stringify(hypothesis)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="glass motion-slide" style={{ padding: 24 }}>
        <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Comparison</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {result.comparison.map((point) => (
            <div key={point.date} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.5)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <span>{point.date}</span>
              <span>Base: {point.baseMillimes}</span>
              <span>Simulated: {point.simulatedMillimes}</span>
              <span style={{ color: point.deltaMillimes < 0 ? "#C2452B" : "#4E8B63" }}>Delta: {point.deltaMillimes}</span>
            </div>
          ))}
        </div>
        {result.shortageWindows.length > 0 && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: "rgba(194,69,43,0.1)", color: "#C2452B", fontWeight: 600 }}>
            Shortage windows: {result.shortageWindows.map((window) => window.date).join(", ")}
          </div>
        )}
      </section>
    </main>
    </FadeIn>
  );
}
