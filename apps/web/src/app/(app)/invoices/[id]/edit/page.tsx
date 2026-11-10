import { redirect } from "next/navigation";
import { PageHeader, Card } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { InvoiceForm } from "../../invoice-form";
import { updateInvoiceDraftAction } from "../../actions";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("invoices.manage");
  const { id } = await params;
  const [invoice, customers] = await Promise.all([
    useCases.getInvoice.execute({ ...actor, invoiceId: id }),
    useCases.listParties.execute({ ...actor, type: "customer" }),
  ]);
  if (invoice.status !== "draft") redirect(`/invoices/${id}`);
  return (
    <main className="shell" style={{ maxWidth: 760 }}>
      <PageHeader eyebrow={`Invoice ${invoice.number}`} title="Edit draft" />
      <Card><InvoiceForm action={updateInvoiceDraftAction} customers={customers} draft={invoice} submitLabel="Save draft" /></Card>
    </main>
  );
}
