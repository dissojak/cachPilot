import { requireActor } from "@/lib/auth-actor";
import { createInvoiceDraftAction } from "@/app/actions";
import FadeIn from "@/components/fade-in";

export default async function NewInvoicePage() {
  await requireActor();
  return (
    <FadeIn>
      <main className="shell motion-fade">
      <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px" }}>New invoice</h1>
      <form action={createInvoiceDraftAction} className="glass" style={{ padding: 32, marginTop: 24, display: "grid", gap: 16, maxWidth: 720 }}>
        <select name="customerId" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} defaultValue="party-acme">
          <option value="party-acme">Acme Client</option>
          <option value="party-globex">Globex Corp</option>
        </select>
        <input name="number" placeholder="Invoice number" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="issueDate" type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="dueDate" type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="description" placeholder="Line description" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="quantity" type="number" placeholder="Quantity" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="unitPriceMillimes" type="number" placeholder="Unit price in millimes" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <button type="submit" style={{ height: 48, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Create draft</button>
      </form>
    </main>
    </FadeIn>
  );
}
