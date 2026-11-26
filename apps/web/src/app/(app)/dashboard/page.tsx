import Link from "next/link";
import { PageHeader, Card, Stat, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { money, date } from "@/lib/format";
import { alertHref, alertTone } from "@/lib/alerts";
import { ForecastChart } from "@/components/forecast-chart";

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard.view");
  const data = await useCases.getDashboard.execute(actor);
  const { forecast } = data;
  const [, d30, d60, d90] = forecast.horizons;
  const shortage = forecast.shortageWindows[0];
  const negative = data.realBalanceMillimes < 0;
  const attention = data.counts.overdueInvoices + data.counts.pendingExpenses;

  return (
    <main className="shell">
      <PageHeader title={data.company.name} description={`Where your cash stands on ${date(forecast.referenceDate)}.`} />

      <section className="glass hero" aria-labelledby="real-balance-label">
        <p id="real-balance-label" className="mono">Real balance</p>
        <div className={`hero-amount${negative ? " is-negative" : ""}`}>{money(data.realBalanceMillimes)}</div>
        <p className="muted hero-note">The opening balance plus every cash movement recorded up to today.</p>
        {shortage
          ? <p className="notice notice-danger" role="status">Cash runs short from {date(shortage.start)} to {date(shortage.end)}. The lowest point is {money(shortage.minimumMillimes)} on {date(shortage.minimumDate)}.</p>
          : <p className="notice notice-ok" role="status">No cash shortage is expected in the next 90 days.</p>}
      </section>

      <div className="grid-stats">
        {[{ days: 30, point: d30 }, { days: 60, point: d60 }, { days: 90, point: d90 }].map(({ days, point }) => {
          const value = typeof point === "object" && point ? point : undefined;
          return (
            <Stat key={days} label={`Forecast in ${days} days`} value={value ? money(value.balanceMillimes) : "—"}
              tone={value && value.balanceMillimes < 0 ? "danger" : "success"} note={value ? `Projected for ${date(value.date)}` : undefined} />
          );
        })}
        <Stat label="Needs attention" value={String(attention)} tone={attention ? "danger" : "success"}
          note={`${data.counts.overdueInvoices} overdue ${data.counts.overdueInvoices === 1 ? "invoice" : "invoices"}, ${data.counts.pendingExpenses} ${data.counts.pendingExpenses === 1 ? "expense" : "expenses"} to approve`} />
      </div>

      <div className="grid-2">
        <Card title="Next 90 days" aside={<Link href="/forecast" className="btn btn-secondary btn-small">Open forecast</Link>}>
          <ForecastChart base={forecast.series} label="Forecast balance for the next 90 days" />
        </Card>

        <Card title="Attention" aside={data.alerts.length > 0 ? <Link href="/alerts" className="btn btn-secondary btn-small">See all</Link> : undefined}>
          {data.alerts.length === 0
            ? <EmptyState title="Nothing needs you" text="No invoice is overdue, no expense is waiting and the forecast stays positive." />
            : (
              <ul className="list plain-list">
                {data.alerts.slice(0, 5).map((alert) => (
                  <li key={`${alert.type}-${alert.entityId}-${alert.date ?? ""}`}>
                    <Link href={alertHref(alert)} className={`alert-item${alertTone[alert.type] === "danger" ? " danger" : ""}`}>
                      <strong>{alert.message}</strong>
                      {alert.date && <small className="muted">{date(alert.date)}</small>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>
    </main>
  );
}
