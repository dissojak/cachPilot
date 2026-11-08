import { useCases } from "@/container";
import { requireActor } from "@/lib/auth-actor";
import { money, date } from "@/lib/format";
import { createRetainerAction, generateRetainerInvoicesAction } from "@/app/actions";
import FadeIn from "@/components/fade-in";

export default async function RetainersPage() {
  const actor = await requireActor();
  const retainers = await useCases.listRetainers.execute({ userId: actor.userId, companyId: actor.companyId });

  return (
    <FadeIn>
      <main className="shell motion-fade">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 24 }}>
        <div>
          <p className="mono">Retainers</p>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>Recurring revenue</h1>
        </div>
      </header>

      <section className="glass motion-slide" style={{ padding: 24, marginBottom: 24 }}>
        <form action={createRetainerAction} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <select name="customerId" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} defaultValue="party-acme">
            <option value="party-acme">Acme Client</option>
            <option value="party-globex">Globex Corp</option>
          </select>
          <input name="name" placeholder="Retainer name" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <input name="amountMillimes" type="number" placeholder="Amount in millimes" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <input name="intervalDays" type="number" placeholder="Interval days" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <input name="nextGenerationDate" type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <button type="submit" style={{ height: 48, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Create retainer</button>
        </form>
      </section>

      <section className="glass motion-slide" style={{ padding: 24, marginBottom: 24 }}>
        <form action={generateRetainerInvoicesAction}>
          <input type="hidden" name="asOfDate" value={new Date().toISOString().slice(0, 10)} />
          <button type="submit" style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Generate due invoices</button>
        </form>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        {retainers.map((retainer) => (
          <article key={retainer.id} className="glass lift motion-pop" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>{retainer.name}</strong>
              <span style={{ color: "#4A6256", fontSize: 13 }}>{retainer.status} · {money(retainer.amountMillimes)} every {retainer.intervalDays} days · next {date(retainer.nextGenerationDate)}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
    </FadeIn>
  );
}
