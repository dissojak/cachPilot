import { money, shortDate } from "@/lib/format";

type Point = { date: string; balanceMillimes: number };

/**
 * Daily balance as an SVG line (server-rendered, no JS). Base = solid green,
 * simulated = dashed clay. The zero line shows when cash runs out.
 */
export function ForecastChart({ base, simulated, label }: { base: Point[]; simulated?: Point[]; label: string }) {
  const width = 760;
  const height = 240;
  const pad = { top: 16, right: 16, bottom: 28, left: 16 };
  const all = [...base, ...(simulated ?? [])].map((point) => point.balanceMillimes);
  const max = Math.max(...all, 0);
  const min = Math.min(...all, 0);
  const span = max - min || 1;
  const x = (index: number) => pad.left + (index / Math.max(base.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value: number) => pad.top + ((max - value) / span) * (height - pad.top - pad.bottom);
  const path = (points: Point[]) => points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.balanceMillimes).toFixed(1)}`).join(" ");
  const ticks = base.filter((_, index) => index % 15 === 0);
  const lowest = (simulated ?? base).reduce((low, point) => (point.balanceMillimes < low.balanceMillimes ? point : low), (simulated ?? base)[0] ?? { date: "", balanceMillimes: 0 });

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label={`${label}. Lowest balance ${money(lowest.balanceMillimes)} on ${lowest.date}.`}>
        <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="#C2452B" strokeOpacity="0.35" strokeDasharray="2 4" />
        <text x={width - pad.right} y={y(0) - 4} textAnchor="end" fontSize="10" fill="#C2452B">0 DNT</text>
        <path d={path(base)} fill="none" stroke="#1F6B4E" strokeWidth="2.5" />
        {simulated && <path d={path(simulated)} fill="none" stroke="#C2452B" strokeWidth="2.5" strokeDasharray="7 5" />}
        {ticks.map((point) => {
          const index = base.indexOf(point);
          return <text key={point.date} x={x(index)} y={height - 8} fontSize="10" fill="#4A6256" textAnchor="middle">{shortDate(point.date)}</text>;
        })}
      </svg>
      <figcaption className="legend">
        <span>{simulated ? "Base forecast" : "Forecast balance"}</span>
        {simulated && <span className="dashed">With hypotheses</span>}
      </figcaption>
    </figure>
  );
}
