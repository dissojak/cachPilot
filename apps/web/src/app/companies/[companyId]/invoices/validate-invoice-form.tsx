"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  validateInvoiceAction,
  type InvoiceActionState,
} from "./actions";

const initialState: InvoiceActionState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "9px 16px",
        background: "#1F6B4E",
        color: "white",
        border: 0,
        borderRadius: 8,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {pending ? "Validating..." : "Validate Invoice"}
    </button>
  );
}

export default function ValidateInvoiceForm({
  companyId,
  invoiceId,
}: {
  companyId: string;
  invoiceId: string;
}) {
  const [state, formAction] = useActionState(
    validateInvoiceAction,
    initialState
  );

  return (
    <form
      action={formAction}
      style={{
        display: "grid",
        gap: 8,
        marginTop: 12,
      }}
    >
      <input
        type="hidden"
        name="companyId"
        value={companyId}
      />

      <input
        type="hidden"
        name="invoiceId"
        value={invoiceId}
      />

      <SubmitButton />

      {state.error && (
        <p role="alert" style={{ color: "#C2452B" }}>
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" style={{ color: "#1F6B4E" }}>
          {state.success}
        </p>
      )}
    </form>
  );
}
