"use client";

import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import type { ActionResult } from "@/lib/action";

type FormAction = (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;

const FieldErrors = createContext<Record<string, string[] | undefined>>({});

/**
 * The only client part of a form (course s.10: "use client" on leaves).
 * Shows the action's message and per-field errors; the page stays a Server Component.
 */
export function ActionForm({ action, children, resetOnSuccess = false, className = "form" }: {
  action: FormAction;
  children: ReactNode;
  resetOnSuccess?: boolean;
  className?: string;
}) {
  const [result, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (result?.ok && resetOnSuccess) formRef.current?.reset();
  }, [result, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className={className} noValidate>
      <FieldErrors.Provider value={result && !result.ok ? result.fieldErrors ?? {} : {}}>
        {children}
      </FieldErrors.Provider>
      {result && (result.message || !result.ok) && (
        <p role={result.ok ? "status" : "alert"} className={`form-message ${result.ok ? "success" : "error"}`}>
          {result.ok ? result.message : result.message}
        </p>
      )}
    </form>
  );
}

type FieldProps = { label: string; name: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>;

/** Label + input + error, linked for screen readers. */
export function Field({ label, name, hint, ...input }: FieldProps) {
  const error = useContext(FieldErrors)[name]?.[0];
  const id = `field-${name}`;
  return (
    <div className="field" data-invalid={error ? "true" : undefined}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-help` : undefined} {...input} />
      {(error || hint) && <span id={`${id}-help`} className={error ? "field-error" : "field-hint"}>{error ?? hint}</span>}
    </div>
  );
}

type SelectProps = { label: string; name: string; options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ label, name, options, ...select }: SelectProps) {
  const error = useContext(FieldErrors)[name]?.[0];
  const id = `field-${name}`;
  return (
    <div className="field" data-invalid={error ? "true" : undefined}>
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} aria-invalid={Boolean(error)} {...select}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function SubmitButton({ children, variant = "primary", small = false }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; small?: boolean }) {
  const { pending } = useFormStatus();
  const classes = ["btn", variant !== "primary" ? `btn-${variant}` : "", small ? "btn-small" : ""].filter(Boolean).join(" ");
  return (
    <button type="submit" className={classes} disabled={pending} aria-busy={pending}>
      {pending ? "Working…" : children}
    </button>
  );
}
