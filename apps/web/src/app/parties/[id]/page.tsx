import { useCases, demo } from "@/container";
import { money, date } from "@/lib/format";
import Link from "next/link";

export default async function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const history = await useCases.getPartyHistory.execute({ userId: demo.ownerUserId, companyId: demo.companyId, partyId: id });

  return (
    <main className="shell motion-fade">
      <header style={{ marginBottom: 24 }}>
        <Link href="/parties" style={{ color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>← Parties</Link>
        <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "12px 0 0" }}>{history.party.name}</h1>
        <p style={{ color: "#4A6256", margin: "8px 0 0" }}>{history.party.type} · {history.party.email ?? "No email"}</p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <article className="glass motion-slide" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 12px" }}>Invoices</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {history.invoices.map((invoice) => (
              <div key={invoice.id} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.5)" }}>
                <strong>{invoice.number}</strong>
                <div style={{ color: "#4A6256", fontSize: 13, marginTop: 4 }}>{invoice.status} · {money(invoice.totalMillimes)} · due {date(invoice.dueDate)}</div>
              </div>
            ))}
          </div>
        </article>
        <article className="glass motion-slide" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 12px" }}>Payments</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {history.payments.map((payment) => (
              <div key={payment.id} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.5)" }}>
                <strong>{money(payment.amountMillimes)}</strong>
                <div style={{ color: "#4A6256", fontSize: 13, marginTop: 4 }}>{payment.method} · {date(payment.paymentDate)}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
