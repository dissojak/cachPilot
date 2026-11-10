import Link from "next/link";
import { PageHeader, Card, Stat, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { money, date } from "@/lib/format";
import { ForecastChart } from "@/components/forecast-chart";

const alertLink: Record<string, (id: string) => string> = {
  invoice_overdue: (id) => `/invoices/${id}`,
  expense_pending: (id) => `/expenses/${id}`,
  forecast_negative: () => "/forecast",
  forecast_below_threshold: () => "/forecast",
};

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard.view");
  const data = await useCases.getDashboard.execute(actor);
  const { forecast } = data;
  const [, d30, d60, d90] = forecast.horizons;
  const shortage = forecast.shortageWindows[0];

  return (
    <main className="shell">
      <PageHeader eyebrow="Dashboard" title={data.company.name} description={`Situation on ${date(forecast.referenceDate)}`} />

      <section className="glass card" style={{ marginBottom: 24 }}>
        <p className="mono">Real balance</p>
        <div className="hero-amount" style={{ marginTop: 8, color: data.realBalanceMillimes < 0 ? "var(--clay)" : undefined }}>{money(data.realBalanceMillimes)}</div>
        <p className="muted" style={{ margin: "12px 0 0" }}>Opening balance plus every recorded cash movement up to today.</p>
      </section>

      <div className="grid-stats">
        {[["In 30 days", d30], ["In 60 days", d60], ["In 90 days", d90]].map(([label, point]) => {
          const value = typeof point === "object" && point ? point : undefined;
          return (
            <Stat key={String(label)} label={`Forecast ${label}`} value={value ? money(value.balanceMillimes) : "—"}
              tone={value && value.balanceMillimes < 0 ? "danger" : "success"} note={value ? date(value.date) : undefined} />
          );
        })}
        <Stat label="To watch" value={String(data.counts.alerts)} tone={data.counts.alerts ? "danger" : "success"}
          note={`${data.counts.overdueInvoices} overdue · ${data.counts.pendingExpenses} to approve`} />
      </div>

      <div className="grid-2">
        <Card title="Next 90 days" aside={<Link href="/forecast" className="btn btn-secondary btn-small">Details</Link>}>
          <ForecastChart base={forecast.series} label="Forecast balance for the next 90 days" />
          {shortage
            ? <p className="field-error" style={{ marginTop: 12 }}>Cash shortage from {date(shortage.start)} to {date(shortage.end)}, lowest {money(shortage.minimumMillimes)} on {date(shortage.minimumDate)}.</p>
            : <p className="muted" style={{ marginTop: 12 }}>No cash shortage expected in the next 90 days.</p>}
        </Card>

        <Card title="Alerts">
          {data.alerts.length === 0
            ? <EmptyState title="All clear" text="No overdue invoice, no expense waiting, and the forecast stays positive." />
            : (
              <div className="list">
                {data.alerts.map((alert) => (
                  <Link key={`${alert.type}-${alert.entityId}-${alert.date ?? ""}`} href={alertLink[alert.type]?.(alert.entityId) ?? "/"}
                    className={`alert-item ${alert.type === "expense_pending" ? "" : "danger"}`}>
                    <strong>{alert.message}</strong>
                    {alert.date && <small className="muted">{date(alert.date)}</small>}
                  </Link>
                ))}
              </div>
            )}
        </Card>
      </div>
    </main>
  );
}
