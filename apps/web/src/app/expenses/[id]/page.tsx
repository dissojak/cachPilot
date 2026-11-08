import { useCases, demo } from "@/container";
import { money, date } from "@/lib/format";
import Link from "next/link";
import { approveExpenseAction, refuseExpenseAction, markExpensePaidAction } from "@/app/actions";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await useCases.getExpense.execute({ userId: demo.ownerUserId, companyId: demo.companyId, expenseId: id });

  return (
    <main className="shell motion-fade">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 24 }}>
        <div>
          <Link href="/expenses" style={{ color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>← Expenses</Link>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "12px 0 0" }}>{expense.description}</h1>
          <p style={{ color: "#4A6256", margin: "8px 0 0" }}>{expense.category} · {expense.status} · {date(expense.expenseDate)}</p>
        </div>
        <div style={{ fontWeight: 700, fontSize: 28 }}>{money(expense.amountMillimes)}</div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <article className="glass motion-slide" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Details</h2>
          <div style={{ display: "grid", gap: 10, color: "#4A6256" }}>
            <div>Submitted by: {expense.submittedBy}</div>
            <div>Receipt: {expense.receiptFileId ?? "None"}</div>
            <div>Approval: {expense.approval ? `${expense.approval.approver} on ${date(expense.approval.decisionDate)}` : "Pending"}</div>
            <div>Payment: {expense.payment ? `${money(expense.payment.amountMillimes)} on ${date(expense.payment.paidDate)}` : "Not paid"}</div>
          </div>
        </article>

        <article className="glass motion-slide" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Actions</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <form action={approveExpenseAction}>
              <input type="hidden" name="expenseId" value={expense.id} />
              <button type="submit" style={{ width: "100%", height: 44, borderRadius: 999, border: 0, background: "#4E8B63", color: "white", fontWeight: 600, cursor: "pointer" }}>Approve</button>
            </form>
            <form action={refuseExpenseAction}>
              <input type="hidden" name="expenseId" value={expense.id} />
              <button type="submit" style={{ width: "100%", height: 44, borderRadius: 999, border: "1px solid #C2452B", background: "transparent", color: "#C2452B", fontWeight: 600, cursor: "pointer" }}>Refuse</button>
            </form>
            <form action={markExpensePaidAction} style={{ display: "grid", gap: 10 }}>
              <input type="hidden" name="expenseId" value={expense.id} />
              <input name="paidDate" type="date" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
              <input name="amountMillimes" type="number" placeholder="Amount in millimes" style={{ height: 44, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
              <button type="submit" style={{ height: 44, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Mark paid</button>
            </form>
          </div>
        </article>
      </section>
    </main>
  );
}
