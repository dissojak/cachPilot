import { PageHeader, Card } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { InvoiceForm } from "../invoice-form";
import { createInvoiceDraftAction } from "../actions";

export default async function NewInvoicePage() {
  const actor = await requirePermission("invoices.manage");
  const customers = await useCases.listParties.execute({ ...actor, type: "customer" });
  return (
    <main className="shell" style={{ maxWidth: 760 }}>
      <PageHeader eyebrow="Invoices" title="New invoice" />
      <Card><InvoiceForm action={createInvoiceDraftAction} customers={customers} submitLabel="Create draft" /></Card>
    </main>
  );
}
