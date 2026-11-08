"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createInvoiceAction,
  type InvoiceActionState,
} from "./actions";

type CustomerOption = {
  id: string;
  name: string;
};

interface Props {
  companyId: string;
  customers: CustomerOption[];
}

const initialState: InvoiceActionState = {
  error: null,
  success: null,
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #CFDFD1",
  marginTop: 6,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: "#1F6B4E",
        color: "white",
        padding: "12px 24px",
        border: 0,
        borderRadius: 10,
        fontWeight: 600,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {pending ? "Creating..." : "Create Invoice Draft"}
    </button>
  );
}

export default function CreateInvoiceForm({
  companyId,
  customers,
}: Props) {
  const [state, formAction] = useActionState(
    createInvoiceAction,
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
      <h2>Create Invoice</h2>

      <input
        type="hidden"
        name="companyId"
        value={companyId}
      />

      <label>
        Customer
        <select
          name="customerId"
          required
          defaultValue=""
          style={fieldStyle}
        >
          <option value="" disabled>
            Select a customer
          </option>

          {customers.map((customer) => (
            <option
              key={customer.id}
              value={customer.id}
            >
              {customer.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Invoice Number
        <input
          name="number"
          type="text"
          required
          maxLength={50}
          placeholder="FAC-2026-001"
          style={fieldStyle}
        />
      </label>

      <label>
        Issue Date
        <input
          name="issueDate"
          type="date"
          required
          style={fieldStyle}
        />
      </label>

      <label>
        Due Date
        <input
          name="dueDate"
          type="date"
          required
          style={fieldStyle}
        />
      </label>

      <h3>Invoice Line</h3>

      <label>
        Description
        <input
          name="description"
          type="text"
          required
          maxLength={300}
          placeholder="Software development service"
          style={fieldStyle}
        />
      </label>

      <label>
        Quantity
        <input
          name="quantity"
          type="number"
          required
          min="1"
          step="1"
          defaultValue="1"
          style={fieldStyle}
        />
      </label>

      <label>
        Unit Price (DT)
        <input
          name="unitPrice"
          type="text"
          inputMode="decimal"
          pattern="[0-9]+(\.[0-9]{1,3})?"
          required
          placeholder="3000.000"
          style={fieldStyle}
        />
      </label>

      {state.error && (
        <p
          role="alert"
          style={{ color: "#C2452B" }}
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          style={{ color: "#1F6B4E" }}
        >
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
