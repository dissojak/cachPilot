import { requireActor } from "@/lib/auth-actor";
import { useCases, demo } from "@/container";
import { money } from "@/lib/format";
import { updateInvoiceDraftAction } from "@/app/actions";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireActor();
  const { id } = await params;
  const invoice = await useCases.getInvoice.execute({ userId: demo.ownerUserId, companyId: demo.companyId, invoiceId: id });

  return (
    <main className="shell motion-fade">
      <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px" }}>Edit draft</h1>
      <form action={updateInvoiceDraftAction} className="glass" style={{ padding: 32, marginTop: 24, display: "grid", gap: 16, maxWidth: 720 }}>
        <input type="hidden" name="invoiceId" value={invoice.id} />
        <input name="number" defaultValue={invoice.number} style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="issueDate" defaultValue={invoice.issueDate} type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="dueDate" defaultValue={invoice.dueDate} type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="description" defaultValue={invoice.lines[0]?.description} placeholder="Line description" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="quantity" defaultValue={invoice.lines[0]?.quantity} type="number" placeholder="Quantity" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="unitPriceMillimes" defaultValue={invoice.lines[0]?.unitPriceMillimes} type="number" placeholder="Unit price in millimes" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <div style={{ color: "#4A6256" }}>Current total: {money(invoice.totalMillimes)}</div>
        <button type="button" style={{ height: 48, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Save draft</button>
      </form>
    </main>
  );
}
