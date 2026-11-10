import type { ReactNode } from "react";

/** Explicit empty state for every list (PROJECT.md §6). */
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p className="muted">{text}</p>
      {action}
    </div>
  );
}
