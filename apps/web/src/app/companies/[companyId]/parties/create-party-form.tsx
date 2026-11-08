
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createPartyAction,
  type CreatePartyState,
} from "./actions";

const initialState: CreatePartyState = {
  error: null,
  success: null,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #CFDFD1",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "12px 24px",
        borderRadius: 10,
        border: 0,
        color: "white",
        background: "#1F6B4E",
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {pending ? "Saving..." : "Add Customer / Supplier"}
    </button>
  );
}

export default function CreatePartyForm({
  companyId,
}: {
  companyId: string;
}) {
  const [state, formAction] = useActionState(
    createPartyAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="glass"
      style={{
        marginTop: 32,
        padding: 28,
        display: "grid",
        gap: 16,
      }}
    >
      <h2>Add Customer or Supplier</h2>

      <input
        type="hidden"
        name="companyId"
        value={companyId}
      />

      <label>
        Type
        <select
          name="type"
          defaultValue="customer"
          style={inputStyle}
        >
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
        </select>
      </label>

      <label>
        Name
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="Company or customer name"
          style={inputStyle}
        />
      </label>

      <label>
        Email
        <input
          name="email"
          type="email"
          placeholder="contact@example.com"
          style={inputStyle}
        />
      </label>

      <label>
        Phone
        <input
          name="phone"
          type="tel"
          maxLength={30}
          placeholder="+216 ..."
          style={inputStyle}
        />
      </label>

      <label>
        Address
        <textarea
          name="address"
          maxLength={300}
          rows={3}
          style={inputStyle}
        />
      </label>

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

      <SubmitButton />
    </form>
  );
}
