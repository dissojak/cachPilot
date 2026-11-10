import Link from "next/link";
import { PageHeader, StatusChip, EmptyState } from "@cashpilot/ui";
import type { ExpenseStatus } from "@cashpilot/application";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel } from "@/lib/format";

const filters: { label: string; value?: ExpenseStatus }[] = [
  { label: "All" }, { label: "To approve", value: "submitted" }, { label: "Approved", value: "approved" },
  { label: "Paid", value: "paid" }, { label: "Refused", value: "refused" },
];

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const actor = await requirePermission("expenses.submit");
  const { status } = await searchParams;
  const active = filters.find((item) => item.value === status)?.value;
  const expenses = await useCases.listExpenses.execute({ ...actor, status: active });
  const all = can(actor, "expenses.viewAll");

  return (
    <main className="shell">
      <PageHeader eyebrow="Expenses" title={all ? "Company expenses" : "My expense requests"}
        description="Submitted → approved or refused by the owner → paid by the finance manager."
        actions={<Link href="/expenses/new" className="btn">+ Submit expense</Link>} />
      <nav className="filters" aria-label="Filter expenses">
        {filters.map((item) => (
          <Link key={item.label} href={item.value ? `/expenses?status=${item.value}` : "/expenses"} className={`filter ${item.value === active ? "active" : ""}`}>{item.label}</Link>
        ))}
      </nav>
      {expenses.length === 0 ? (
        <section className="glass"><EmptyState title="No expense here" text="Submitted expenses and their decisions appear in this list." action={<Link href="/expenses/new" className="btn">Submit an expense</Link>} /></section>
      ) : (
        <div className="list">
          {expenses.map((expense) => (
            <Link key={expense.id} href={`/expenses/${expense.id}`} className="glass lift row">
              <div><strong>{expense.description}</strong><small>{expense.category}</small></div>
              <div><small>Amount</small><strong>{money(expense.amountMillimes)}</strong></div>
              <div><small>Date</small><strong>{date(expense.expenseDate)}</strong></div>
              <StatusChip status={expense.status} label={statusLabel[expense.status] ?? expense.status} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
