import { PageHeader, Card, Stat, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission, can } from "@/lib/session";
import { money, date, movementLabel } from "@/lib/format";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { setOpeningBalanceAction, recordAdjustmentAction, reverseMovementAction } from "./actions";

export default async function CashPage() {
  const actor = await requirePermission("cash.view");
  const [balance, movements] = await Promise.all([
    useCases.getRealBalance.execute(actor),
    useCases.listCashMovements.execute(actor),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const canAdjust = can(actor, "cash.adjust");
  const hasOpening = movements.some((movement) => movement.type === "opening");
  const rows = [...movements].reverse();
  // an adjustment that already has a reversal is not offered again (the server also refuses it)
  const reversed = new Set(movements.map((movement) => movement.reversesId).filter(Boolean));

  return (
    <main className="shell">
      <PageHeader title="Cash"
        description="Every cash movement that really happened. Nothing is edited or deleted: a mistake is fixed with a new adjustment that gives the reason." />

      <div className="grid-stats">
        <Stat label="Real balance today" value={money(balance.balanceMillimes)} tone={balance.balanceMillimes < 0 ? "danger" : "success"} note="Opening balance plus all movements up to today" />
        <Stat label="Movements recorded" value={String(movements.length)} note="Opening, payments in, expenses paid, adjustments" />
      </div>

      <div className="grid-2">
        <Card title="History">
          {rows.length === 0
            ? <EmptyState title="No movement yet" text={canAdjust ? "Record the opening balance to start tracking your cash." : "Cash movements appear here once the owner records the opening balance."} />
            : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Date</th><th>Type</th><th>Reason or source</th><th className="num">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {rows.map((movement) => (
                      <tr key={movement.id}>
                        <td>{date(movement.movementDate)}</td>
                        <td>{movementLabel[movement.type] ?? movement.type}</td>
                        <td className="muted">{movement.reason ?? movement.sourceType}</td>
                        <td className={`num ${movement.amountMillimes < 0 ? "amount-out" : "amount-in"}`}>{money(movement.amountMillimes)}</td>
                        <td>
                          {canAdjust && movement.type === "adjustment" && !reversed.has(movement.id) && (
                            <details className="reverse">
                              <summary>Reverse</summary>
                              <ActionForm action={reverseMovementAction} className="form reverse-form">
                                <input type="hidden" name="movementId" value={movement.id} />
                                <Field id={`reason-${movement.id}`} label="Reason for reversing" name="reason" hint="The original stays in the history." required />
                                <SubmitButton variant="danger" small>Reverse this adjustment</SubmitButton>
                              </ActionForm>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </Card>

        {canAdjust && (
          <div className="stack">
            {!hasOpening && (
              <Card title="Opening balance">
                <p className="muted page-lead">Cash you had on the day you started. Recorded once.</p>
                <ActionForm action={setOpeningBalanceAction}>
                  <Field label="Amount (DNT)" name="amount" inputMode="decimal" placeholder="5000.000" required />
                  <Field label="Date" name="openingDate" type="date" defaultValue={today} max={today} required />
                  <div className="form-footer"><SubmitButton>Record opening balance</SubmitButton></div>
                </ActionForm>
              </Card>
            )}
            <Card title="Record an adjustment">
              <p className="muted page-lead">For cash that moved outside a payment, such as a bank fee or a counting error.</p>
              <ActionForm action={recordAdjustmentAction} resetOnSuccess>
                <Field label="Amount (DNT)" name="amount" inputMode="decimal" placeholder="-25.500" hint="Use a minus sign to take cash out" required />
                <Field label="Date" name="movementDate" type="date" defaultValue={today} max={today} required />
                <Field label="Reason" name="reason" placeholder="Bank fee, counting error…" required />
                <div className="form-footer"><SubmitButton>Record adjustment</SubmitButton></div>
              </ActionForm>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
