import { PageHeader, Card, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { auditActionLabel, dateTime, entityLabel } from "@/lib/format";

export default async function AuditLogPage() {
  const actor = await requirePermission("audit.view");
  const entries = await useCases.listAuditLog.execute(actor);

  return (
    <main className="shell">
      <PageHeader
        title="Audit log"
        description="Who changed what, and when. Entries are added, never edited or deleted."
      />
      <Card title={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}>
        {entries.length === 0
          ? <EmptyState title="Nothing recorded yet" text="Validated invoices, payments, decisions and member changes are listed here as they happen." />
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>When</th><th>Who</th><th>What happened</th><th>On</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={`${entry.at}-${entry.entityId}-${index}`}>
                      <td className="muted nowrap">{dateTime(entry.at)}</td>
                      <td>{entry.actorName}</td>
                      <td>{auditActionLabel[entry.action] ?? entry.action}</td>
                      <td className="muted">{entityLabel[entry.entityType] ?? entry.entityType}</td>
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
