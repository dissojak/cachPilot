import { PageHeader, Card, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { money, date } from "@/lib/format";
import { ForecastChart } from "@/components/forecast-chart";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { addHypothesisAction, removeHypothesisAction } from "../actions";

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("simulations.use");
  const { id } = await params;
  const [result, invoices] = await Promise.all([
    useCases.runSimulation.execute({ ...actor, scenarioId: id }),
    useCases.listInvoices.execute(actor),
  ]);
  const receivable = invoices.filter((invoice) => invoice.status === "validated" || invoice.status === "partially_paid");

  return (
    <main className="shell">
      <PageHeader eyebrow="Scenario" title={result.scenario.name} description={`Compared from ${date(result.scenario.baseReferenceDate)} over 90 days. Real data is never modified.`} />

      <Card title="Base vs simulated">
        <ForecastChart base={result.base.series} simulated={result.simulated.series} label="Base and simulated forecast" />
        {result.simulated.shortageWindows.length === 0
          ? <p className="muted" style={{ marginTop: 12 }}>No cash shortage with these hypotheses.</p>
          : result.simulated.shortageWindows.map((window) => (
            <p key={window.start} className="field-error" style={{ marginTop: 12 }}>
              Shortage {date(window.start)} → {date(window.end)}: lowest {money(window.minimumMillimes)} on {date(window.minimumDate)}.
            </p>
          ))}
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>Date</th><th className="num">Base</th><th className="num">Simulated</th><th className="num">Difference</th></tr></thead>
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
      </Card>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Card title="Hypotheses">
          {result.hypotheses.length === 0
            ? <EmptyState title="No hypothesis" text="Without hypotheses the two lines are identical." />
            : (
              <div className="list">
                {result.hypotheses.map((hypothesis, index) => (
                  <div key={index} className="alert-item" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <span>
                      {hypothesis.amountMillimes !== undefined && hypothesis.date !== undefined
                        ? `${hypothesis.type === "new_expense" ? "New expense" : "Extra income"} “${hypothesis.label}”: ${money(hypothesis.amountMillimes)} on ${date(hypothesis.date)}`
                        : hypothesis.label}
                    </span>
                    <ActionForm action={removeHypothesisAction} className="inline-form">
                      <input type="hidden" name="scenarioId" value={id} />
                      <input type="hidden" name="index" value={index} />
                      <SubmitButton variant="secondary" small>Remove</SubmitButton>
                    </ActionForm>
                  </div>
                ))}
              </div>
            )}
        </Card>

        <div className="stack">
          <Card title="A client pays late">
            {receivable.length === 0 ? <p className="muted">No unpaid validated invoice to delay.</p> : (
              <ActionForm action={addHypothesisAction}>
                <input type="hidden" name="type" value="client_delay" />
                <input type="hidden" name="scenarioId" value={id} />
                <SelectField label="Invoice" name="invoiceId" options={receivable.map((invoice) => ({ value: invoice.id, label: `${invoice.number} · ${money(invoice.remainingMillimes)} due ${date(invoice.dueDate)}` }))} />
                <Field label="Delay (days)" name="delayDays" type="number" min={1} max={365} defaultValue={20} required />
                <SubmitButton>Add delay</SubmitButton>
              </ActionForm>
            )}
          </Card>
          <Card title="New expense or extra income">
            <ActionForm action={addHypothesisAction} resetOnSuccess>
              <input type="hidden" name="scenarioId" value={id} />
              <SelectField label="Kind" name="type" options={[{ value: "new_expense", label: "New expense" }, { value: "extra_income", label: "Extra income" }]} />
              <Field label="Label" name="label" placeholder="New laptop, grant…" required />
              <div className="form-row">
                <Field label="Amount (DNT)" name="amount" inputMode="decimal" required />
                <Field label="Date" name="date" type="date" required />
              </div>
              <SubmitButton>Add hypothesis</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </main>
  );
}
