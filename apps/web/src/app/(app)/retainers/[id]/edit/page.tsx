import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { moneyInput } from "@/lib/format";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { updateRetainerAction } from "../../actions";

export default async function EditRetainerPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("retainers.manage");
  const { id } = await params;
  const retainer = (await useCases.listRetainers.execute(actor)).find((item) => item.id === id);
  if (!retainer) notFound();

  return (
    <main className="shell width-form">
      <PageHeader title={`Edit ${retainer.name}`}
        description="Changes apply to the invoices generated from now on. Invoices already issued are not changed."
        actions={<Link href="/retainers" className="btn btn-secondary btn-small">Back to retainers</Link>} />
      <Card>
        <ActionForm action={updateRetainerAction} className="form">
          <input type="hidden" name="retainerId" value={retainer.id} />
          <Field label="Name" name="name" defaultValue={retainer.name} required />
          <div className="form-row">
            <Field label="Amount (DNT)" name="amount" inputMode="decimal" defaultValue={moneyInput(retainer.amountMillimes)} required />
            <Field label="Every (days)" name="intervalDays" type="number" min={1} max={366} defaultValue={retainer.intervalDays} required />
          </div>
          <Field label="Next invoice date" name="nextGenerationDate" type="date" defaultValue={retainer.nextGenerationDate} required />
          <SubmitButton>Save retainer</SubmitButton>
        </ActionForm>
      </Card>
    </main>
  );
}
