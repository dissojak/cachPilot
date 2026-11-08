
import Link from "next/link";

import { requireCompanyActor } from "@/lib/company-actor";
import { onboardingUseCases } from "@/container/onboarding";

import CreateInvoiceForm from "./create-invoice-form";
import ValidateInvoiceForm from "./validate-invoice-form";

interface Props {
  params: Promise<{
    companyId: string;
  }>;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  validated: "Validated",
  partially_paid: "Partially Paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

function formatMoney(millimes: number): string {
  return `${(millimes / 1000).toLocaleString(
    "fr-TN",
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }
  )} DT`;
}

export default async function InvoicesPage({
  params,
}: Props) {
  const { companyId } = await params;

  const actor = await requireCompanyActor(companyId);

  // Customers belong to the selected company.
  const customers =
    await onboardingUseCases.listParties.execute({
      userId: actor.userId,
      companyId: actor.companyId,
      type: "customer",
    });

  const invoices =
    await onboardingUseCases.listInvoices.execute({
      userId: actor.userId,
      companyId: actor.companyId,
    });

  const customerNames = new Map(
    customers.map((customer) => [
      customer.id,
      customer.name,
    ])
  );

  const canManage =
    actor.role === "owner" ||
    actor.role === "finance_manager";

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
      }}
    >
      <Link href={`/companies/${companyId}`}>
        Back to Company
      </Link>

      <header style={{ marginTop: 32 }}>
        <p className="mono">
          CashPilot / Invoicing
        </p>

        <h1>Invoices</h1>

        <p>
          Company: <strong>{actor.companyName}</strong>
        </p>

        <p>
          Total invoices: <strong>{invoices.length}</strong>
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gap: 16,
          marginTop: 32,
        }}
      >
        {invoices.map((invoice) => (
          <article
            key={invoice.id}
            className="glass"
            style={{ padding: 24 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2>{invoice.number}</h2>

                <p>
                  Customer:{" "}
                  <strong>
                    {customerNames.get(invoice.customerId) ??
                      "Unknown customer"}
                  </strong>
                </p>

                <p>Issued: {invoice.issueDate}</p>
                <p>Due: {invoice.dueDate}</p>
              </div>

              <div>
                <p>
                  Status:{" "}
                  <strong>
                    {statusLabels[invoice.status] ??
                      invoice.status}
                  </strong>
                </p>

                <p>
                  Total:{" "}
                  <strong>
                    {formatMoney(invoice.totalMillimes)}
                  </strong>
                </p>

                <p>
                  Remaining:{" "}
                  <strong>
                    {formatMoney(
                      invoice.remainingMillimes
                    )}
                  </strong>
                </p>
              </div>
            </div>

            {canManage &&
              invoice.status === "draft" && (
                <ValidateInvoiceForm
                  companyId={companyId}
                  invoiceId={invoice.id}
                />
              )}
          </article>
        ))}
      </section>

      {invoices.length === 0 && (
        <p style={{ marginTop: 24 }}>
          No invoices found.
        </p>
      )}

      {canManage && customers.length > 0 && (
        <CreateInvoiceForm
          companyId={companyId}
          customers={customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
          }))}
        />
      )}

      {canManage && customers.length === 0 && (
        <p style={{ marginTop: 32 }}>
          Create a customer before creating an invoice.
          {" "}
          <Link href={`/companies/${companyId}/parties`}>
            Go to Customers
          </Link>
        </p>
      )}
    </main>
  );
}
