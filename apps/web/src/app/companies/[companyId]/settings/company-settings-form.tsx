
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  updateCompanyAction,
  type UpdateCompanyState,
} from "./actions";

const initialState: UpdateCompanyState = {
  error: null,
  success: false,
};

type Props = {
  companyId: string;
  name: string;
  sector: string;
  forecastThresholdMillimes: number;
};

const inputStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 10,
  border: "1px solid #CFDFD1",
  background: "white",
  color: "#123A2B",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "14px 24px",
        background: "#1F6B4E",
        color: "white",
        border: 0,
        borderRadius: 12,
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.6 : 1,
        fontWeight: 600,
      }}
    >
      {pending ? "Saving..." : "Save Changes"}
    </button>
  );
}

export default function CompanySettingsForm({
  companyId,
  name,
  sector,
  forecastThresholdMillimes,
}: Props) {
  const [state, formAction] = useActionState(
    updateCompanyAction,
    initialState
  );

  return (
    <form
      action={formAction}
      style={{
        display: "grid",
        gap: 20,
      }}
    >
      <input
        type="hidden"
        name="companyId"
        value={companyId}
      />

      <div>
        <label htmlFor="name">Company Name</label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={name}
          minLength={2}
          maxLength={100}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="sector">Business Sector</label>
        <select
          id="sector"
          name="sector"
          defaultValue={sector}
          required
          style={inputStyle}
        >
          {![
            "digital agency",
            "training center",
            "commerce",
            "services",
          ].includes(sector) && (
            <option value={sector}>{sector}</option>
          )}

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

      <div>
        <label htmlFor="forecastThreshold">
          Forecast Alert Threshold (TND)
        </label>
        <input
          id="forecastThreshold"
          name="forecastThreshold"
          type="text"
          inputMode="decimal"
          defaultValue={(
            forecastThresholdMillimes / 1000
          ).toFixed(3)}
          required
          style={inputStyle}
        />

        <small>
          Example: 1000.000 = 1,000 TND.
        </small>
      </div>

      {state.error && (
        <p role="alert" style={{ color: "#C2452B" }}>
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" style={{ color: "#1F6B4E" }}>
          Company updated successfully.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
