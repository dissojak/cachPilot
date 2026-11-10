import type { ReactNode } from "react";

/** The frosted "glass" panel used everywhere. */
export function Card({ title, aside, children, className = "" }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass card ${className}`}>
      {(title || aside) && (
        <div className="card-head">
          {title && <h2 className="card-title">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
