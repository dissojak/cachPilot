import { requireActor } from "@/lib/auth-actor";
import { submitExpenseAction } from "@/app/actions";
import FadeIn from "@/components/fade-in";

export default async function NewExpensePage() {
  await requireActor();
  return (
    <FadeIn>
      <main className="shell motion-fade">
      <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px" }}>Submit expense</h1>
      <form action={submitExpenseAction} className="glass" style={{ padding: 32, marginTop: 24, display: "grid", gap: 16, maxWidth: 720 }}>
        <input name="category" placeholder="Category" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="description" placeholder="Description" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="amountMillimes" type="number" placeholder="Amount in millimes" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="expenseDate" type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <input name="receiptFileId" placeholder="Receipt file id" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
        <button type="submit" style={{ height: 48, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Submit expense</button>
      </form>
    </main>
    </FadeIn>
  );
}
