/** A KPI tile: label, big value, short note. */
export function Stat({ label, value, note, tone = "default" }: { label: string; value: string; note?: string; tone?: "default" | "danger" | "success" }) {
  return (
    <article className="glass stat">
      <p className="mono">{label}</p>
      <div className={`stat-value stat-${tone}`}>{value}</div>
      {note && <p className="muted stat-note">{note}</p>}
    </article>
  );
}
