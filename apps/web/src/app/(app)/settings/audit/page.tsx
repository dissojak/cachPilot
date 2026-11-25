import { PageHeader, Card, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";

const actionLabel: Record<string, string> = {
  "invoice.validated": "Invoice validated",
  "invoice.cancelled": "Invoice cancelled",
  "payment.recorded": "Payment recorded",
  "expense.approved": "Expense approved",
  "expense.refused": "Expense refused",
  "expense.paid": "Expense paid",
  "cash.adjusted": "Cash adjusted",
  "cash.opening_set": "Opening balance set",
  "member.invited": "Member invited",
  "member.role_changed": "Role changed",
  "member.removed": "Member removed",
  "company.updated": "Company updated",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
}

export default async function AuditLogPage() {
  const actor = await requirePermission("audit.view");
  const entries = await useCases.listAuditLog.execute(actor);

  return (
    <main className="shell">
      <PageHeader
        eyebrow="Settings"
        title="Audit log"
        description="Who changed what, and when. Entries are never edited or deleted."
      />
      <Card title={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}>
        {entries.length === 0
          ? <EmptyState title="Nothing recorded yet" text="Validated invoices, payments, approvals and member changes appear here." />
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>When</th><th>Who</th><th>Action</th><th>Subject</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={`${entry.at}-${entry.entityId}-${index}`}>
                      <td className="muted">{when(entry.at)}</td>
                      <td>{entry.actorName}</td>
                      <td>{actionLabel[entry.action] ?? entry.action}</td>
                      <td className="muted">{entry.entityType} · {entry.entityId}</td>
                      <td>{entry.reason ?? "—"}</td>
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
