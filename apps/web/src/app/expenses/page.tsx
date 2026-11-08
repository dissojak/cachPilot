import { useCases } from "@/container";
import { requireActor } from "@/lib/auth-actor";
import { money, date } from "@/lib/format";
import Link from "next/link";

export default async function ExpensesPage() {
  const actor = await requireActor();
  const expenses = await useCases.listExpenses.execute({ userId: actor.userId, companyId: actor.companyId });

  return (
    <main className="shell motion-fade">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 24 }}>
        <div>
          <p className="mono">Expenses</p>
          <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>Spending control</h1>
        </div>
        <Link href="/expenses/new" style={{ height: 44, padding: "0 20px", borderRadius: 999, background: "#1F6B4E", color: "white", textDecoration: "none", display: "inline-flex", alignItems: "center", fontWeight: 600 }}>+ Submit expense</Link>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        {expenses.map((expense) => (
          <article key={expense.id} className="glass lift motion-pop" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>{expense.description}</strong>
              <span style={{ color: "#4A6256", fontSize: 13 }}>{expense.category} · {date(expense.expenseDate)} · {expense.status}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <strong>{money(expense.amountMillimes)}</strong>
              <Link href={`/expenses/${expense.id}`} style={{ color: "#1F6B4E", textDecoration: "underline", fontWeight: 600 }}>View</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
