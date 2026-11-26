/** A bar showing how much of a total is covered (e.g. paid of invoiced). Values are integer millimes. */
export function AmountProgress({ value, max, label }: { value: number; max: number; label: string }) {
  return <progress className="amount-progress" value={Math.min(Math.max(value, 0), Math.max(max, 1))} max={Math.max(max, 1)} aria-label={label} />;
}
