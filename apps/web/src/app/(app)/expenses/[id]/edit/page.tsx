import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Card } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { moneyInput } from "@/lib/format";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { updateExpenseAction } from "../../actions";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("expenses.submit");
  const { id } = await params;
  const expense = await useCases.getExpense.execute({ ...actor, expenseId: id });
  // Same rule as the domain: only while submitted, and only by the submitter or a payer.
  const canEdit = expense.status === "submitted" && (expense.submittedBy === actor.userId || can(actor, "expenses.pay"));
  if (!canEdit) redirect(`/expenses/${id}`);

  return (
    <main className="shell width-form">
      <PageHeader title="Edit expense"
        description="You can change it until a decision is made. After that it is locked."
        actions={<Link href={`/expenses/${id}`} className="btn btn-secondary btn-small">Back to expense</Link>} />
      <Card>
        <ActionForm action={updateExpenseAction} className="form">
          <input type="hidden" name="expenseId" value={expense.id} />
          <Field label="Description" name="description" defaultValue={expense.description} required />
          <div className="form-row">
            <Field label="Category" name="category" defaultValue={expense.category} required />
            <Field label="Amount (DNT)" name="amount" inputMode="decimal" defaultValue={moneyInput(expense.amountMillimes)} required />
          </div>
          <Field label="Planned date" name="expenseDate" type="date" defaultValue={expense.expenseDate} required />
          <SubmitButton>Save expense</SubmitButton>
        </ActionForm>
      </Card>
    </main>
  );
}
