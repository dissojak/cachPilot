import { useCases, demo } from "@/container";
import { money } from "@/lib/format";
import Link from "next/link";
import { createPartyAction } from "@/app/actions";

export default async function PartiesPage() {
  const parties = await useCases.listParties.execute({ userId: demo.ownerUserId, companyId: demo.companyId });

  return (
    <main className="shell motion-fade">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 24 }}>
        <div>
          <p className="mono">Parties</p>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>Customers and suppliers</h1>
        </div>
      </header>

      <section className="glass motion-slide" style={{ padding: 24, marginBottom: 24 }}>
        <form action={createPartyAction} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <select name="type" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 12px" }} defaultValue="customer">
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
          </select>
          <input name="name" placeholder="Name" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <input name="email" placeholder="Email" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <button type="submit" style={{ height: 48, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Add party</button>
        </form>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        {parties.map((party) => (
          <article key={party.id} className="glass lift motion-pop" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>{party.name}</strong>
              <span style={{ color: "#4A6256", fontSize: 13 }}>{party.type} · {party.email ?? "No email"}</span>
            </div>
            <Link href={`/parties/${party.id}`} style={{ color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>View history</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
