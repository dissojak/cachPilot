import Link from "next/link";
import { PageHeader, Card } from "@cashpilot/ui";
import { requirePermission } from "@/lib/session";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { submitExpenseAction } from "../actions";

export default async function NewExpensePage() {
  await requirePermission("expenses.submit");
  return (
    <main className="shell width-form">
      <PageHeader title="Submit an expense"
        description="An owner approves or refuses it. Once approved, it appears in the forecast on its planned date." />
      <Card>
        <ActionForm action={submitExpenseAction} className="form">
          <div className="form-row">
            <Field label="Category" name="category" placeholder="Software, travel, rent…" required />
            <Field label="Amount (DNT)" name="amount" inputMode="decimal" placeholder="400.000" required />
          </div>
          <Field label="Description" name="description" placeholder="Design tool subscription, monthly" required />
          <Field label="Planned payment date" name="expenseDate" type="date" required />
          <Field label="Receipt" name="receipt" type="file" accept="image/*,application/pdf" hint="Optional. An image or a PDF, 5 MB at most. You can add it later." />
          <div className="form-footer">
            <Link href="/expenses" className="btn btn-secondary">Cancel</Link>
            <SubmitButton>Submit expense</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </main>
  );
}
