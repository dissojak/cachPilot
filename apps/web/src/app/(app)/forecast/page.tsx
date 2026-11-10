import { PageHeader, Card, Stat, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { money, date } from "@/lib/format";
import { ForecastChart } from "@/components/forecast-chart";

/**
 * M8: forecast at a date = real balance + expected receipts − planned
 * disbursements up to that date (PROJECT.md §4). The page shows the inputs
 * so every number can be explained.
 */
export default async function ForecastPage() {
  const actor = await requirePermission("forecast.view");
  const forecast = await useCases.getForecast.execute(actor);
  const [today, ...horizons] = forecast.horizons;

  return (
    <main className="shell">
      <PageHeader eyebrow="Forecast" title="Cash forecast" description={`Projection from ${date(forecast.referenceDate)}: real balance + unpaid invoices at their due date − approved expenses at their date.`} />
      <div className="grid-stats">
        <Stat label="Today (real)" value={money(today?.balanceMillimes ?? 0)} />
        {horizons.map((point, index) => (
          <Stat key={point.date} label={`+${(index + 1) * 30} days`} value={money(point.balanceMillimes)} note={date(point.date)} tone={point.balanceMillimes < 0 ? "danger" : "success"} />
        ))}
      </div>

      <Card title="Daily balance, next 90 days">
        <ForecastChart base={forecast.series} label="Daily forecast balance" />
        {forecast.shortageWindows.length === 0
          ? <p className="muted" style={{ marginTop: 12 }}>The balance stays positive for the next 90 days.</p>
          : forecast.shortageWindows.map((window) => (
            <p key={window.start} className="field-error" style={{ marginTop: 12 }}>
              Shortage from {date(window.start)} to {date(window.end)}: lowest {money(window.minimumMillimes)} on {date(window.minimumDate)}.
            </p>
          ))}
      </Card>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Card title="Expected receipts">
          {forecast.receipts.length === 0
            ? <EmptyState title="Nothing expected" text="Validated invoices with an unpaid amount appear here at their due date." />
            : <InputsTable rows={forecast.receipts} sign={1} />}
        </Card>
        <Card title="Planned payments">
          {forecast.disbursements.length === 0
            ? <EmptyState title="Nothing planned" text="Approved expenses not yet paid appear here at their date." />
            : <InputsTable rows={forecast.disbursements} sign={-1} />}
        </Card>
      </div>
    </main>
  );
}

function InputsTable({ rows, sign }: { rows: { sourceId: string; label: string; date: string; amountMillimes: number }[]; sign: 1 | -1 }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Date</th><th>What</th><th className="num">Amount</th></tr></thead>
        <tbody>
          {[...rows].sort((a, b) => a.date.localeCompare(b.date)).map((row) => (
            <tr key={row.sourceId}>
              <td>{date(row.date)}</td>
              <td>{row.label}</td>
              <td className={`num ${sign > 0 ? "amount-in" : "amount-out"}`}>{money(sign * row.amountMillimes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
