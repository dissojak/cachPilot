import { PageHeader, Card, Stat, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { money, date } from "@/lib/format";
import { ForecastChart } from "@/components/forecast-chart";
import type { ChartEvent } from "@/components/forecast-chart";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { addHypothesisAction } from "../actions";
import { WhatIfRow } from "./whatif-row";
import type { WhatIfData } from "./whatif-row";

type Point = { date: string; balanceMillimes: number };
function lowestPoint(points: Point[]): Point | undefined {
  return points.reduce<Point | undefined>((low, point) => (!low || point.balanceMillimes < low.balanceMillimes ? point : low), undefined);
}

type TimelineRow = { key: string; date: string; label: string; amountMillimes: number; whatIf: boolean; edit?: WhatIfData; note?: string };

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("simulations.use");
  const { id } = await params;
  const [result, invoices] = await Promise.all([
    useCases.runSimulation.execute({ ...actor, scenarioId: id }),
    useCases.listInvoices.execute(actor),
  ]);
  const receivable = invoices.filter((invoice) => invoice.status === "validated" || invoice.status === "partially_paid");
  const invoiceOptions = receivable.map((invoice) => ({ value: invoice.id, label: `${invoice.number}, ${money(invoice.remainingMillimes)} due ${date(invoice.dueDate)}` }));
  const baseLow = lowestPoint(result.base.series);
  const simLow = lowestPoint(result.simulated.series);
  const shortageCount = result.simulated.shortageWindows.length;
  const start = result.scenario.baseReferenceDate;

  // Everything that moves money, in date order: the real plan plus the what-ifs (the delayed invoice replaces its original date).
  const delayedInvoices = new Set(result.hypotheses.flatMap((hypothesis) => (hypothesis.type === "client_delay" && hypothesis.invoiceId ? [hypothesis.invoiceId] : [])));
  const rows: TimelineRow[] = [
    ...result.base.receipts.filter((item) => !delayedInvoices.has(item.sourceId)).map((item) => ({ key: `r-${item.sourceId}`, date: item.date, label: `Invoice ${item.label} due`, amountMillimes: item.amountMillimes, whatIf: false })),
    ...result.base.disbursements.map((item) => ({ key: `d-${item.sourceId}`, date: item.date, label: item.label, amountMillimes: -item.amountMillimes, whatIf: false })),
    ...result.hypotheses.flatMap((hypothesis, index): TimelineRow[] => {
      if (hypothesis.amountMillimes === undefined || hypothesis.date === undefined) return [];
      const isDelay = hypothesis.type === "client_delay";
      const note = isDelay
        ? (hypothesis.originalDate ? `was due ${date(hypothesis.originalDate)}` : undefined)
        : (hypothesis.date < start ? "before the start date, counted on day 1" : undefined);
      const sign = hypothesis.type === "new_expense" ? -1 : 1;
      const edit: WhatIfData = {
        index, type: hypothesis.type, title: hypothesis.label, label: isDelay ? "" : hypothesis.label,
        invoiceId: hypothesis.invoiceId, delayDays: hypothesis.delayDays,
        amountMillimes: hypothesis.amountMillimes, date: hypothesis.date, note,
      };
      return [{ key: `h-${index}`, date: hypothesis.date, label: hypothesis.label, amountMillimes: sign * hypothesis.amountMillimes, whatIf: true, edit, note }];
    }),
  ].sort((a, b) => (a.date === b.date ? Number(a.whatIf) - Number(b.whatIf) : a.date < b.date ? -1 : 1));

  const series = result.simulated.series;
  const balanceAfter = (day: string) => {
    let found = series[0];
    for (const point of series) {
      if (point.date <= day) found = point;
      else break;
    }
    return found?.balanceMillimes;
  };
  const events: ChartEvent[] = rows.map((row) => ({ date: row.date < start ? start : row.date, label: row.label, amountMillimes: row.amountMillimes }));

  return (
    <main className="shell">
      <PageHeader title={result.scenario.name}
        description={`Compared with the base forecast for the 90 days from ${date(result.scenario.baseReferenceDate)}. Your real data is never changed.`} />

      <div className="grid-stats">
        <Stat label="Lowest balance, base" value={baseLow ? money(baseLow.balanceMillimes) : "—"} note={baseLow ? `On ${date(baseLow.date)}` : undefined} tone={baseLow && baseLow.balanceMillimes < 0 ? "danger" : "default"} />
        <Stat label="Lowest balance, with hypotheses" value={simLow ? money(simLow.balanceMillimes) : "—"} note={simLow ? `On ${date(simLow.date)}` : undefined} tone={simLow && simLow.balanceMillimes < 0 ? "danger" : "success"} />
        <Stat label="Shortage periods" value={String(shortageCount)} tone={shortageCount ? "danger" : "success"} note={shortageCount ? "With these hypotheses" : "None with these hypotheses"} />
      </div>

      <Card title="What happens, day by day">
        {rows.length === 0
          ? <EmptyState title="Nothing planned yet" text="Validate an invoice or approve an expense, then add hypotheses below to see them here in date order." />
          : (
            <div className="table-wrap timeline">
              <table className="table">
                <thead><tr><th>Date</th><th>What</th><th className="num">Amount</th><th className="num">Balance after (with hypotheses)</th><th /></tr></thead>
                <tbody>
                  {rows.map((row) => {
                    const balance = balanceAfter(row.date);
                    if (row.whatIf && row.edit) {
                      return <WhatIfRow key={row.key} scenarioId={id} data={row.edit} signedMillimes={row.amountMillimes} balanceMillimes={balance} invoiceOptions={invoiceOptions} />;
                    }
                    return (
                      <tr key={row.key} className={balance !== undefined && balance < 0 ? "row-short" : undefined}>
                        <td className="timeline-date">{date(row.date)}</td>
                        <td><span className="timeline-label"><span className="chip chip-neutral">Planned</span>{row.label}</span></td>
                        <td className={`num ${row.amountMillimes < 0 ? "amount-out" : "amount-in"}`}>{row.amountMillimes > 0 ? "+" : ""}{money(row.amountMillimes)}</td>
                        <td className={`num ${balance !== undefined && balance < 0 ? "amount-out" : ""}`}>{balance === undefined ? "—" : money(balance)}</td>
                        <td />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <div className="mt-24" />
      <Card title="Balance over time">
        <ForecastChart base={result.base.series} simulated={result.simulated.series} events={events} label="Base and simulated forecast" baseLabel="Base forecast" simulatedLabel="With hypotheses" />
        {result.simulated.shortageWindows.length === 0
          ? <p className="notice notice-ok">No cash shortage with these hypotheses.</p>
          : result.simulated.shortageWindows.map((window) => (
            <p key={window.start} className="notice notice-danger">
              Cash runs short from {date(window.start)} to {date(window.end)}. The lowest point is {money(window.minimumMillimes)} on {date(window.minimumDate)}.
            </p>
          ))}
        <details className="details-block mt-16">
          <summary>Day-by-day comparison</summary>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th className="num">Base</th><th className="num">With hypotheses</th><th className="num">Difference</th></tr></thead>
              <tbody>{result.comparison.map((row) => (
                <tr key={row.date}>
                  <td>{date(row.date)}</td>
                  <td className="num">{money(row.baseMillimes)}</td>
                  <td className={`num ${row.simulatedMillimes < 0 ? "amount-out" : ""}`}>{money(row.simulatedMillimes)}</td>
                  <td className={`num ${row.deltaMillimes < 0 ? "amount-out" : row.deltaMillimes > 0 ? "amount-in" : ""}`}>{money(row.deltaMillimes)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </details>
      </Card>

      <div className="grid-2 mt-24">
          <Card title="A customer pays late">
            <p className="muted mb-16">Pick one invoice and its own delay. Customers you leave out pay on time.</p>
            {receivable.length === 0
              ? <p className="muted">There is no unpaid validated invoice to delay.</p>
              : (
                <ActionForm action={addHypothesisAction} className="form">
                  <input type="hidden" name="type" value="client_delay" />
                  <input type="hidden" name="scenarioId" value={id} />
                  <SelectField label="Invoice" name="invoiceId" options={invoiceOptions} />
                  <Field label="Delay (days)" name="delayDays" type="number" min={1} max={365} defaultValue={20} required />
                  <div className="form-footer"><SubmitButton>Add delay</SubmitButton></div>
                </ActionForm>
              )}
          </Card>
          <Card title="A new expense or extra income">
            <p className="muted mb-16">A new client or a grant is an extra income: give it an amount and a date.</p>
            <ActionForm action={addHypothesisAction} resetOnSuccess className="form">
              <input type="hidden" name="scenarioId" value={id} />
              <SelectField label="Kind" name="type" options={[{ value: "new_expense", label: "New expense" }, { value: "extra_income", label: "Extra income" }]} />
              <Field label="Label" name="label" placeholder="New laptop, new client Beta…" required />
              <div className="form-row">
                <Field label="Amount (DNT)" name="amount" inputMode="decimal" required />
                <Field label="Date" name="date" type="date" required />
              </div>
              <div className="form-footer"><SubmitButton>Add to scenario</SubmitButton></div>
            </ActionForm>
          </Card>
      </div>
    </main>
  );
}
