
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createCompanyAction,
  type CreateCompanyState,
} from "./actions";

const initialState: CreateCompanyState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%",
        padding: 16,
        borderRadius: 12,
        border: 0,
        background: "#1F6B4E",
        color: "white",
        fontWeight: 600,
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.65 : 1,
      }}
    >
      {pending ? "Creating company..." : "Create Company"}
    </button>
  );
}

export default function CompanyForm() {
  const [state, formAction] = useActionState(
    createCompanyAction,
    initialState
  );

  const inputStyle = {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    border: "1px solid #CFDFD1",
    background: "white",
    color: "#123A2B",
  };

  return (
    <form
      action={formAction}
      style={{ display: "grid", gap: 20 }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="name">Company name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Atlas Studio"
          minLength={2}
          maxLength={100}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="sector">Business sector</label>
        <select
          id="sector"
          name="sector"
          required
          defaultValue=""
          style={inputStyle}
        >
          <option value="" disabled>
            Select a sector
          </option>
          <option value="digital agency">
            Digital Agency
          </option>
          <option value="training center">
            Training Center
          </option>
          <option value="commerce">
            Commerce
          </option>
          <option value="services">
            Services
          </option>
        </select>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="openingBalance">
          Opening balance (DNT)
        </label>
        <input
          id="openingBalance"
          name="openingBalance"
          type="text"
          inputMode="decimal"
          placeholder="5000.000"
          defaultValue="0.000"
          required
          style={inputStyle}
        />
        <small>
          Example: 5000.250 = 5,000 dinars and
          250 millimes.
        </small>
      </div>

      {state.error && (
        <p role="alert" style={{ color: "#C2452B" }}>
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
