import type { ReactNode } from "react";

export type Step = { label: string; detail?: ReactNode; state: "done" | "current" | "todo" | "danger" };

/** Where an operation is in its lifecycle, in order (e.g. draft → validated → paid). */
export function StepTrail({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <ol className="step-trail" aria-label={label}>
      {steps.map((step) => (
        <li key={step.label} className={`step is-${step.state}`} aria-current={step.state === "current" ? "step" : undefined}>
          <span className="step-dot" aria-hidden="true" />
          <div>
            <strong>{step.label}</strong>
            {step.detail && <small className="muted">{step.detail}</small>}
          </div>
        </li>
      ))}
    </ol>
  );
}
