import Link from "next/link";
import { PageHeader, Card, StatusChip, EmptyState } from "@cashpilot/ui";
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
      <PageHeader
        title={all ? "Company expenses" : "My expense requests"}
        description="Submitted, then approved or refused by an owner, then paid by the finance manager."
        actions={<Link href="/expenses/new" className="btn">Submit expense</Link>}
      />
      <nav className="filters" aria-label="Filter expenses">
        {filters.map((item) => {
          const current = item.value === active;
          return (
            <Link key={item.label} href={item.value ? `/expenses?status=${item.value}` : "/expenses"} className={`filter${current ? " active" : ""}`} aria-current={current ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Card>
        {expenses.length === 0
          ? (
            <EmptyState
              title="No expense here"
              text="Submitted expenses and their decisions appear in this list."
              action={<Link href="/expenses/new" className="btn">Submit an expense</Link>}
            />
          )
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Description</th><th>Category</th><th>Date</th><th className="num">Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td><Link href={`/expenses/${expense.id}`} className="table-main">{expense.description}</Link></td>
                      <td className="muted">{expense.category}</td>
                      <td>{date(expense.expenseDate)}</td>
                      <td className="num">{money(expense.amountMillimes)}</td>
                      <td><StatusChip status={expense.status} label={statusLabel[expense.status] ?? expense.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </main>
  );
}
