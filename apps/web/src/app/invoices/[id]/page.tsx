import { useCases } from "@/container";
import { requireActor } from "@/lib/auth-actor";
import { money, date } from "@/lib/format";
import Link from "next/link";
import { validateInvoiceAction, cancelInvoiceAction, recordPaymentAction } from "@/app/actions";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const invoice = await useCases.getInvoice.execute({ userId: actor.userId, companyId: actor.companyId, invoiceId: id });
  const payments = await useCases.listPaymentsForInvoice.execute({ userId: actor.userId, companyId: actor.companyId, invoiceId: id });

  return (
    <main className="shell motion-fade">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 24 }}>
        <div>
          <Link href="/invoices" style={{ color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>← Invoices</Link>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "12px 0 0" }}>{invoice.number}</h1>
          <p style={{ color: "#4A6256", margin: "8px 0 0" }}>{invoice.status} · due {date(invoice.dueDate)}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {invoice.status === "draft" && (
            <form action={validateInvoiceAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Validate</button>
            </form>
          )}
          <form action={cancelInvoiceAction}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 999, border: "1px solid #C2452B", background: "transparent", color: "#C2452B", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </form>
          <a href={`/api/invoices/${invoice.id}/pdf`} style={{ height: 40, padding: "0 16px", borderRadius: 999, border: "1px solid rgba(31,107,78,0.25)", display: "inline-flex", alignItems: "center", color: "#1F6B4E", textDecoration: "none", fontWeight: 600 }}>Export PDF</a>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
        <article className="glass motion-slide" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Lines</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {invoice.lines.map((line, index) => (
              <div key={index} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between" }}>
                <span>{line.description} × {line.quantity}</span>
                <strong>{money(line.lineTotalMillimes)}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Total</span>
            <span>{money(invoice.totalMillimes)}</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", color: "#4A6256" }}>
            <span>Remaining</span>
            <span>{money(invoice.remainingMillimes)}</span>
          </div>
        </article>

        <article className="glass motion-slide" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Record payment</h2>
          <form action={recordPaymentAction} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input name="amountMillimes" type="number" placeholder="Amount in millimes" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="paymentDate" type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="method" placeholder="Method" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <input name="note" placeholder="Note" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
            <button type="submit" style={{ height: 48, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Record payment</button>
          </form>

          <h3 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 16, margin: "24px 0 12px" }}>Payments</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {payments.map((payment) => (
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
