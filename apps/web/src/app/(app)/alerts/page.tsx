import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { date } from "@/lib/format";
import { alertFilters, alertHref, alertTone, alertTypeLabel } from "@/lib/alerts";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const actor = await requirePermission("dashboard.view");
  const { type } = await searchParams;
  const filter = alertFilters.find((option) => option.value === type)?.value;
  const alerts = await useCases.listAlerts.execute({ ...actor, type: filter });

  return (
    <main className="shell">
      <PageHeader
        title="Attention"
        description="Overdue invoices, expenses waiting for a decision and cash shortages, most urgent first."
      />

      <nav className="filters" aria-label="Filter alerts">
        {alertFilters.map((option) => {
          const active = option.value === filter;
          const href = option.value ? `/alerts?type=${option.value}` : "/alerts";
          return (
            <Link key={option.label} href={href} className={`filter${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              {option.label}
            </Link>
          );
        })}
      </nav>

      <Card title={`${alerts.length} ${alerts.length === 1 ? "item" : "items"}`}>
        {alerts.length === 0
          ? <EmptyState title="Nothing needs you" text="No invoice is overdue, no expense is waiting and the forecast stays above your threshold." />
          : (
            <ul className="list plain-list">
              {alerts.map((alert) => (
                <li key={`${alert.type}-${alert.entityId}-${alert.date ?? ""}`}>
                  <Link href={alertHref(alert)} className={`alert-item${alertTone[alert.type] === "danger" ? " danger" : ""}`}>
                    <small className="muted">{alertTypeLabel[alert.type]}</small>
                    <strong>{alert.message}</strong>
                    {alert.date && <small className="muted">{date(alert.date)}</small>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </Card>
    </main>
  );
}
