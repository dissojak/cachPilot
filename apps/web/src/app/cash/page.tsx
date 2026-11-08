import { useCases, demo } from "@/container";
import { money, date } from "@/lib/format";
import { setOpeningBalanceAction, recordAdjustmentAction } from "@/app/actions";

export default async function CashPage() {
  const balance = await useCases.getRealBalance.execute({ userId: demo.ownerUserId, companyId: demo.companyId });
  const movements = await useCases.listCashMovements.execute({ userId: demo.ownerUserId, companyId: demo.companyId });

  return (
    <main className="shell motion-fade">
      <header style={{ marginBottom: 24 }}>
        <p className="mono">Cash</p>
        <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px", margin: "8px 0 0" }}>Real cash</h1>
      </header>

      <section className="glass motion-slide" style={{ padding: 32, marginBottom: 24 }}>
        <p className="mono">Real balance</p>
        <div style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 56, lineHeight: "56px", fontWeight: 600, marginTop: 8 }}>{money(balance.balanceMillimes)}</div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <form action={setOpeningBalanceAction} className="glass" style={{ padding: 24, display: "grid", gap: 12 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: 0 }}>Set opening balance</h2>
          <input name="amountMillimes" type="number" placeholder="Amount in millimes" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <button type="submit" style={{ height: 44, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Save</button>
        </form>
        <form action={recordAdjustmentAction} className="glass" style={{ padding: 24, display: "grid", gap: 12 }}>
          <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: 0 }}>Record adjustment</h2>
          <input name="amountMillimes" type="number" placeholder="Signed amount in millimes" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <input name="movementDate" type="date" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <input name="reason" placeholder="Reason" style={{ height: 48, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} />
          <button type="submit" style={{ height: 44, borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>Record</button>
        </form>
      </section>

      <section className="glass motion-slide" style={{ padding: 24 }}>
        <h2 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 20, margin: "0 0 16px" }}>Movements</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {movements.map((movement) => (
            <div key={movement.id} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong style={{ display: "block" }}>{movement.type}</strong>
                <span style={{ color: "#4A6256", fontSize: 13 }}>{movement.reason ?? movement.sourceType} · {date(movement.movementDate)}</span>
              </div>
              <strong style={{ color: movement.amountMillimes < 0 ? "#C2452B" : "#4E8B63" }}>{money(movement.amountMillimes)}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
