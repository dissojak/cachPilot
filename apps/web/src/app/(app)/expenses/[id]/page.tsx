import Link from "next/link";
import { PageHeader, Card, StatusChip, StepTrail, type Step } from "@cashpilot/ui";
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
  const status = expense.status;
  const approval = expense.approval;
  const payment = expense.payment;

  // Rules mirror the domain: only the submitter (or a payer) edits, and only while submitted.
  const canEdit = status === "submitted" && (expense.submittedBy === actor.userId || can(actor, "expenses.pay"));
  const canAttach = (status === "submitted" || status === "approved") && (expense.submittedBy === actor.userId || can(actor, "expenses.pay"));

  const steps: Step[] = [
    { label: "Submitted", detail: `by ${nameOf(expense.submittedBy)}`, state: "done" },
    status === "refused"
      ? { label: "Refused", detail: approval ? `${date(approval.decisionDate)} by ${nameOf(approval.approver)}` : undefined, state: "danger" }
      : status === "submitted"
        ? { label: "Awaiting decision", detail: "An owner approves or refuses", state: "current" }
        : { label: "Approved", detail: approval ? `${date(approval.decisionDate)} by ${nameOf(approval.approver)}` : undefined, state: "done" },
    status === "refused"
      ? { label: "Cannot be paid", detail: "Refused expenses are closed", state: "danger" }
      : status === "paid"
        ? { label: "Paid", detail: payment ? `${date(payment.paidDate)} by ${nameOf(payment.paidBy)}` : undefined, state: "done" }
        : status === "approved"
          ? { label: "Awaiting payment", detail: "A finance manager pays it", state: "current" }
          : { label: "Payment", detail: "Not yet approved", state: "todo" },
  ];

  return (
    <main className="shell">
      <PageHeader title={expense.description}
        description={`${expense.category} · planned for ${date(expense.expenseDate)}`}
        actions={<>
          {canEdit && <Link href={`/expenses/${expense.id}/edit`} className="btn btn-secondary btn-small">Edit</Link>}
          <StatusChip status={status} label={statusLabel[status] ?? status} />
        </>} />

      <Card>
        <StepTrail steps={steps} label="Expense progress" />
      </Card>

      <div className="grid-2 mt-24">
        <Card title="Details">
          <p className="amount-hero">{money(expense.amountMillimes)}</p>
          <dl className="kv mt-24">
            <dt>Category</dt><dd>{expense.category}</dd>
            <dt>Planned date</dt><dd>{date(expense.expenseDate)}</dd>
            <dt>Submitted by</dt><dd>{nameOf(expense.submittedBy)}</dd>
            <dt>Receipt</dt><dd>{expense.receiptFileId ? "Attached" : "None yet"}</dd>
          </dl>
          {status === "refused" && approval?.reason && (
            <p className="notice notice-danger">Refused: {approval.reason}</p>
          )}
        </Card>

        <div className="stack">
          {status === "submitted" && can(actor, "expenses.decide") && (
            <Card title="Decide">
              <p className="decision-note muted">Approving makes this a planned payment in the forecast.</p>
              <ActionForm action={approveExpenseAction}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <SubmitButton>Approve expense</SubmitButton>
              </ActionForm>
              <hr className="card-divider" />
              <p className="decision-note muted">Refusing ends the expense for good. It can never be paid.</p>
              <ActionForm action={refuseExpenseAction}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <Field label="Reason for refusal" name="reason" hint="Required. It stays on this expense." required />
                <SubmitButton variant="danger">Refuse expense</SubmitButton>
              </ActionForm>
            </Card>
          )}

          {status === "approved" && can(actor, "expenses.pay") && (
            <Card title="Pay this expense">
              <p className="decision-note muted">Pays exactly this amount and adds one cash movement to the real balance.</p>
              <p className="amount-hero">{money(expense.amountMillimes)}</p>
              <div className="mt-24">
                <ActionForm action={markExpensePaidAction}>
                  <input type="hidden" name="expenseId" value={expense.id} />
                  <Field label="Payment date" name="paidDate" type="date" defaultValue={today} max={today} required />
                  <SubmitButton>Mark as paid</SubmitButton>
                </ActionForm>
              </div>
            </Card>
          )}

          {status === "paid" && (
            <Card title="Paid">
              <p className="muted">This expense is closed and counted in the real balance.</p>
            </Card>
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
