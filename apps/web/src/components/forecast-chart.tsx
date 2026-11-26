"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { money, date, shortDate } from "@/lib/format";

type Point = { date: string; balanceMillimes: number };
/** Something that happens on a day (an invoice due, an expense, a what-if). Shown in the tooltip and as a dot on the line. */
export type ChartEvent = { date: string; label: string; amountMillimes: number };

const WIDTH = 760;
const HEIGHT = 300;
const PAD = { top: 16, right: 16, bottom: 30, left: 66 };

/** Axis ticks on round numbers so the zero line is always a gridline. */
function niceTicks(min: number, max: number, count = 5) {
  const span = max - min || 1000;
  const raw = span / (count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * magnitude;
  const low = Math.floor(min / step) * step;
  const high = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = low; value <= high + step / 2; value += step) ticks.push(Math.round(value));
  return { ticks, low, high };
}

/** "−2,000" (dinars, no decimals) for the axis; the tooltip shows the exact amount. */
function axisLabel(millimes: number) {
  const dinars = Math.round(millimes / 1000);
  const digits = Math.abs(dinars).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${dinars < 0 ? "−" : ""}${digits}`;
}

function signed(millimes: number) {
  return `${millimes > 0 ? "+" : ""}${money(millimes)}`;
}

/**
 * Daily balance. Base = solid green; simulated = dashed clay. Hover (or the
 * arrow keys) shows the date, both balances and what happens that day.
 */
export function ForecastChart({ base, simulated, events = [], label, baseLabel, simulatedLabel }: {
  base: Point[];
  simulated?: Point[];
  events?: ChartEvent[];
  label: string;
  baseLabel?: string;
  simulatedLabel?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const count = base.length;
  if (count === 0) return null;

  const values = [...base, ...(simulated ?? [])].map((point) => point.balanceMillimes);
  const { ticks, low, high } = niceTicks(Math.min(...values, 0), Math.max(...values, 0));
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (index / Math.max(count - 1, 1)) * plotWidth;
  const y = (value: number) => PAD.top + ((high - value) / (high - low || 1)) * plotHeight;
  // Balances change on a given day and stay flat until the next one: a step line tells the truth.
  const path = (points: Point[]) => points.map((point, index) => {
    if (index === 0) return `M${x(0).toFixed(1)},${y(point.balanceMillimes).toFixed(1)}`;
    return `L${x(index).toFixed(1)},${y(points[index - 1]!.balanceMillimes).toFixed(1)} L${x(index).toFixed(1)},${y(point.balanceMillimes).toFixed(1)}`;
  }).join(" ");

  const tickEvery = Math.max(1, Math.round(count / 6));
  const xTicks = base.map((point, index) => ({ point, index })).filter(({ index }) => index % tickEvery === 0);
  const line = simulated ?? base;
  const lowest = line.reduce((lowestSoFar, point) => (point.balanceMillimes < lowestSoFar.balanceMillimes ? point : lowestSoFar), line[0]!);
  const indexOfDate = new Map(base.map((point, index) => [point.date, index]));
  const markers = events.flatMap((event) => {
    const index = indexOfDate.get(event.date);
    return index === undefined ? [] : [index];
  });

  const select = (event: PointerEvent<SVGRectElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const viewX = ((event.clientX - box.left) / box.width) * WIDTH;
    const index = Math.round(((viewX - PAD.left) / plotWidth) * (count - 1));
    setActive(Math.max(0, Math.min(count - 1, index)));
  };
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); setActive((current) => Math.min(count - 1, (current ?? -1) + 1)); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setActive((current) => Math.max(0, (current ?? 1) - 1)); }
    else if (event.key === "Escape") setActive(null);
  };

  const day = active === null ? null : base[active]!;
  const simulatedDay = active === null || !simulated ? null : simulated[active]!;
  const dayEvents = day ? events.filter((event) => event.date === day.date) : [];
  const flip = active !== null && active > count * 0.6;

  return (
    <figure className="chart-figure">
      <div className="chart-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="chart"
          role="img"
          tabIndex={0}
          aria-label={`${label}. Lowest balance ${money(lowest.balanceMillimes)} on ${date(lowest.date)}. Use the left and right arrow keys to read each day.`}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          {low < 0 && <rect x={PAD.left} y={y(0)} width={plotWidth} height={y(low) - y(0)} fill="#C2452B" fillOpacity="0.06" />}
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? "#C2452B" : "#DCE7DA"} strokeOpacity={tick === 0 ? 0.55 : 1} strokeDasharray={tick === 0 ? "3 4" : undefined} />
              <text x={PAD.left - 8} y={y(tick) + 3.5} fontSize="11" textAnchor="end" fill={tick === 0 ? "#C2452B" : "#4A6256"}>{axisLabel(tick)}</text>
            </g>
          ))}
          <text x={PAD.left - 8} y={PAD.top - 5} fontSize="10" textAnchor="end" fill="#7C8F83">DNT</text>
          {xTicks.map(({ point, index }) => (
            <text key={point.date} x={x(index)} y={HEIGHT - 9} fontSize="11" fill="#4A6256" textAnchor={index === 0 ? "start" : "middle"}>{shortDate(point.date)}</text>
          ))}

          <path d={path(base)} fill="none" stroke="#1F6B4E" strokeWidth="2.5" strokeLinejoin="round" />
          {simulated && <path d={path(simulated)} fill="none" stroke="#C2452B" strokeWidth="2.5" strokeDasharray="7 5" strokeLinejoin="round" />}

          {markers.map((index) => {
            const point = line[index]!;
            return <circle key={`${index}-${point.date}`} cx={x(index)} cy={y(point.balanceMillimes)} r="3.5" fill="#fff" stroke={simulated ? "#C2452B" : "#1F6B4E"} strokeWidth="1.75" />;
          })}

          {active !== null && day && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="#4A6256" strokeOpacity="0.45" />
              <circle cx={x(active)} cy={y(day.balanceMillimes)} r="5" fill="#1F6B4E" stroke="#fff" strokeWidth="2" />
              {simulatedDay && <circle cx={x(active)} cy={y(simulatedDay.balanceMillimes)} r="5" fill="#C2452B" stroke="#fff" strokeWidth="2" />}
            </g>
          )}
          <rect x={PAD.left} y={PAD.top} width={plotWidth} height={plotHeight} fill="transparent" onPointerMove={select} onPointerDown={select} onPointerLeave={() => setActive(null)} />
        </svg>

        {active !== null && day && (
          <div className="chart-tip" role="status" style={{ left: `${(x(active) / WIDTH) * 100}%`, transform: flip ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}>
            <strong>{date(day.date)}</strong>
            <dl>
              <div><dt><i className="swatch" />{baseLabel ?? (simulated ? "Base forecast" : "Forecast balance")}</dt><dd className={day.balanceMillimes < 0 ? "amount-out" : ""}>{money(day.balanceMillimes)}</dd></div>
              {simulatedDay && (
                <>
                  <div><dt><i className="swatch swatch-sim" />{simulatedLabel ?? "With hypotheses"}</dt><dd className={simulatedDay.balanceMillimes < 0 ? "amount-out" : ""}>{money(simulatedDay.balanceMillimes)}</dd></div>
                  <div><dt>Difference</dt><dd>{signed(simulatedDay.balanceMillimes - day.balanceMillimes)}</dd></div>
                </>
              )}
            </dl>
            {dayEvents.length > 0 && (
              <ul>
                {dayEvents.map((event, index) => (
                  <li key={index}><span>{event.label}</span><span className={event.amountMillimes < 0 ? "amount-out" : "amount-in"}>{signed(event.amountMillimes)}</span></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <figcaption className="legend">
        <span>{baseLabel ?? (simulated ? "Base forecast" : "Forecast balance")}</span>
        {simulated && <span className="dashed">{simulatedLabel ?? "With hypotheses"}</span>}
        {events.length > 0 && <span className="legend-dot">Day with an event</span>}
      </figcaption>
    </figure>
  );
}
