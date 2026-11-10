import { PageHeader, Card, StatusChip } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, statusLabel } from "@/lib/format";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { approveExpenseAction, refuseExpenseAction, markExpensePaidAction, attachReceiptAction } from "../actions";

export default async function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("expenses.submit");
  const { id } = await params;
  const expense = await useCases.getExpense.execute({ ...actor, expenseId: id });
  const members = await useCases.listMembers.execute(actor);
  const nameOf = (userId?: string) => members.find((member) => member.userId === userId)?.name ?? "a former member";
  const today = new Date().toISOString().slice(0, 10);
  const canAttach = (expense.status === "submitted" || expense.status === "approved") && (expense.submittedBy === actor.userId || can(actor, "expenses.pay"));

  return (
    <main className="shell">
      <PageHeader eyebrow="Expense" title={expense.description}
        actions={<StatusChip status={expense.status} label={statusLabel[expense.status] ?? expense.status} />} />
      <div className="grid-2">
        <Card title="Details">
          <dl className="kv">
            <dt>Amount</dt><dd>{money(expense.amountMillimes)}</dd>
            <dt>Category</dt><dd>{expense.category}</dd>
            <dt>Planned date</dt><dd>{date(expense.expenseDate)}</dd>
            <dt>Submitted by</dt><dd>{nameOf(expense.submittedBy)}</dd>
            {expense.approval && (<><dt>{expense.status === "refused" ? "Refused" : "Approved"}</dt><dd>{date(expense.approval.decisionDate)} by {nameOf(expense.approval.approver)}{expense.approval.reason ? ` — ${expense.approval.reason}` : ""}</dd></>)}
            {expense.payment && (<><dt>Paid</dt><dd>{date(expense.payment.paidDate)} by {nameOf(expense.payment.paidBy)}</dd></>)}
            <dt>Receipt</dt><dd>{expense.receiptFileId ? "Attached" : "None"}</dd>
          </dl>
        </Card>

        <div className="stack">
          {expense.status === "submitted" && can(actor, "expenses.decide") && (
            <Card title="Decision">
              <ActionForm action={approveExpenseAction}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <SubmitButton>Approve</SubmitButton>
              </ActionForm>
              <ActionForm action={refuseExpenseAction} className="form" >
                <input type="hidden" name="expenseId" value={expense.id} />
                <Field label="Reason for refusal" name="reason" required />
                <SubmitButton variant="danger">Refuse</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {expense.status === "approved" && can(actor, "expenses.pay") && (
            <Card title="Pay this expense">
              <p className="muted">Pays exactly {money(expense.amountMillimes)} and adds one cash movement.</p>
              <ActionForm action={markExpensePaidAction}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <Field label="Payment date" name="paidDate" type="date" defaultValue={today} max={today} required />
                <SubmitButton>Mark as paid</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {expense.status === "refused" && (
            <Card title="Refused"><p className="muted">A refused expense can never be paid.</p></Card>
          )}

          {canAttach && (
            <Card title={expense.receiptFileId ? "Replace receipt" : "Attach a receipt"}>
              <ActionForm action={attachReceiptAction}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <Field label="File (image or PDF, 5 MB max)" name="receipt" type="file" accept="image/*,application/pdf" />
                <SubmitButton variant="secondary">Upload</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
