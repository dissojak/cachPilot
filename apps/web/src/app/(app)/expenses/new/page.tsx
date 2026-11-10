import { PageHeader, Card } from "@cashpilot/ui";
import { requirePermission } from "@/lib/session";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { submitExpenseAction } from "../actions";

export default async function NewExpensePage() {
  await requirePermission("expenses.submit");
  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <PageHeader eyebrow="Expenses" title="Submit an expense" description="The owner approves or refuses it. Once approved it appears in the forecast at its date." />
      <Card>
        <ActionForm action={submitExpenseAction}>
          <div className="form-row">
            <Field label="Category" name="category" placeholder="Software, travel, rent…" required />
            <Field label="Amount (DNT)" name="amount" inputMode="decimal" placeholder="400.000" required />
          </div>
          <Field label="Description" name="description" required />
          <Field label="Planned payment date" name="expenseDate" type="date" required />
          <Field label="Receipt (image or PDF, 5 MB max, optional)" name="receipt" type="file" accept="image/*,application/pdf" />
          <SubmitButton>Submit expense</SubmitButton>
        </ActionForm>
      </Card>
    </main>
  );
}
