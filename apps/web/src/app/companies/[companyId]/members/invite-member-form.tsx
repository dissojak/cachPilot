
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  inviteMemberAction,
  type InviteMemberState,
} from "./actions";

const initialState: InviteMemberState = {
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
        padding: "12px 24px",
        background: "#1F6B4E",
        color: "white",
        border: 0,
        borderRadius: 12,
        fontWeight: 600,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {pending ? "Adding..." : "Add Member"}
    </button>
  );
}

export default function InviteMemberForm({
  companyId,
}: {
  companyId: string;
}) {
  const [state, formAction] = useActionState(
    inviteMemberAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="glass"
      style={{
        padding: 28,
        marginTop: 28,
        display: "grid",
        gap: 16,
      }}
    >
      <h2>Add Team Member</h2>

      <input
        type="hidden"
        name="companyId"
        value={companyId}
      />

      <div>
        <label htmlFor="email">
          User Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="member@example.com"
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "1px solid #CFDFD1",
          }}
        />
      </div>

      <div>
        <label htmlFor="role">
          Member Role
        </label>

        <select
          id="role"
          name="role"
          defaultValue="collaborator"
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "1px solid #CFDFD1",
          }}
        >
          <option value="collaborator">
            Collaborator
          </option>

          <option value="finance_manager">
            Finance Manager
          </option>
        </select>
      </div>

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
