import { PageHeader, Card, Stat, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, movementLabel } from "@/lib/format";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { setOpeningBalanceAction, recordAdjustmentAction } from "./actions";

export default async function CashPage() {
  const actor = await requirePermission("cash.view");
  const [balance, movements] = await Promise.all([
    useCases.getRealBalance.execute(actor),
    useCases.listCashMovements.execute(actor),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const hasOpening = movements.some((movement) => movement.type === "opening");
  const rows = [...movements].reverse();

  return (
    <main className="shell">
      <PageHeader eyebrow="Cash" title="Real cash" description="Every realized operation is one movement. Nothing is edited or deleted: corrections are new adjustments with a reason." />
      <div className="grid-stats">
        <Stat label="Real balance today" value={money(balance.balanceMillimes)} tone={balance.balanceMillimes < 0 ? "danger" : "success"} />
        <Stat label="Movements" value={String(movements.length)} note="Opening, payments received, expenses paid, adjustments" />
      </div>

      <div className="grid-2">
        <Card title="History">
          {rows.length === 0
            ? <EmptyState title="No movement yet" text="Record the opening balance to start tracking cash." />
            : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Date</th><th>Type</th><th>Reason / source</th><th className="num">Amount</th></tr></thead>
                  <tbody>
                    {rows.map((movement) => (
                      <tr key={movement.id}>
                        <td>{date(movement.movementDate)}</td>
                        <td>{movementLabel[movement.type] ?? movement.type}</td>
                        <td className="muted">{movement.reason ?? movement.sourceType}</td>
                        <td className={`num ${movement.amountMillimes < 0 ? "amount-out" : "amount-in"}`}>{money(movement.amountMillimes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </Card>

        {can(actor, "cash.adjust") && (
          <div className="stack">
            {!hasOpening && (
              <Card title="Opening balance">
                <ActionForm action={setOpeningBalanceAction}>
                  <Field label="Amount (DNT)" name="amount" inputMode="decimal" placeholder="5000.000" required />
                  <Field label="Date" name="openingDate" type="date" defaultValue={today} max={today} required />
                  <SubmitButton>Record opening balance</SubmitButton>
                </ActionForm>
              </Card>
            )}
            <Card title="Record an adjustment">
              <ActionForm action={recordAdjustmentAction} resetOnSuccess>
                <Field label="Amount (DNT)" name="amount" inputMode="decimal" placeholder="-25.500" hint="Negative removes cash, positive adds cash" required />
                <Field label="Date" name="movementDate" type="date" defaultValue={today} max={today} required />
                <Field label="Reason" name="reason" placeholder="Bank fee, counting error…" required />
                <SubmitButton>Record adjustment</SubmitButton>
              </ActionForm>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
