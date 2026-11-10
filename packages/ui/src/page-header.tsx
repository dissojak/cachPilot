import type { ReactNode } from "react";

/** Eyebrow label, page title and optional actions on the right. */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <p className="mono">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {description && <p className="muted page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
