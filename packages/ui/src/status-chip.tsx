const tones: Record<string, string> = {
  draft: "neutral",
  validated: "info",
  partially_paid: "warning",
  paid: "success",
  cancelled: "danger",
  submitted: "warning",
  approved: "info",
  refused: "danger",
  active: "success",
  paused: "neutral",
  overdue: "danger",
};

/** Colored pill for a status; the label text comes from the caller. */
export function StatusChip({ status, label }: { status: string; label: string }) {
  return <span className={`chip chip-${tones[status] ?? "neutral"}`}>{label}</span>;
}
