"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  changeMemberRoleAction,
  removeMemberAction,
  type MemberActionState,
} from "./actions";

interface Props {
  companyId: string;
  userId: string;
  currentRole: "finance_manager" | "collaborator";
}

const initialState: MemberActionState = {
  error: null,
  success: null,
};

function SubmitButton({
  label,
}: {
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "10px 16px",
        border: 0,
        borderRadius: 10,
        background: "#1F6B4E",
        color: "white",
        cursor: pending ? "wait" : "pointer",
        fontWeight: 600,
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export default function MemberActions({
  companyId,
  userId,
  currentRole,
}: Props) {
  const [roleState, changeRoleFormAction] =
    useActionState(
      changeMemberRoleAction,
      initialState
    );

  const [removeState, removeFormAction] =
    useActionState(
      removeMemberAction,
      initialState
    );

  const [showRemoveConfirmation, setShowRemoveConfirmation] =
    useState(false);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        width: "100%",
        marginTop: 16,
      }}
    >
      {/* CHANGE MEMBER ROLE */}
      <form
        action={changeRoleFormAction}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="hidden"
          name="companyId"
          value={companyId}
        />

        <input
          type="hidden"
          name="userId"
          value={userId}
        />

        <select
          key={currentRole}
          name="role"
          defaultValue={currentRole}
          aria-label="Member role"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #CFDFD1",
            minWidth: 180,
          }}
        >
          <option value="collaborator">
            Collaborator
          </option>

          <option value="finance_manager">
            Finance Manager
          </option>
        </select>

        <SubmitButton label="Change Role" />
      </form>

      {roleState.error && (
        <p role="alert" style={{ color: "#C2452B" }}>
          {roleState.error}
        </p>
      )}

      {roleState.success && (
        <p role="status" style={{ color: "#1F6B4E" }}>
          {roleState.success}
        </p>
      )}

      {/* REMOVE MEMBER */}
      {!showRemoveConfirmation ? (
        <button
          type="button"
          onClick={() =>
            setShowRemoveConfirmation(true)
          }
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #C2452B",
            background: "transparent",
            color: "#C2452B",
            cursor: "pointer",
            width: "fit-content",
            fontWeight: 600,
          }}
        >
          Remove Member
        </button>
      ) : (
        <div
          style={{
            padding: 16,
            border: "1px solid #C2452B",
            borderRadius: 12,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            Are you sure you want to remove this member?
          </p>

          <form
            action={removeFormAction}
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <input
              type="hidden"
              name="companyId"
              value={companyId}
            />

            <input
              type="hidden"
              name="userId"
              value={userId}
            />

            <button
              type="submit"
              style={{
                padding: "10px 16px",
                border: 0,
                borderRadius: 10,
                background: "#C2452B",
                color: "white",
                cursor: "pointer",
              }}
            >
              Confirm Remove
            </button>

            <button
              type="button"
              onClick={() =>
                setShowRemoveConfirmation(false)
              }
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #CFDFD1",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {removeState.error && (
        <p role="alert" style={{ color: "#C2452B" }}>
          {removeState.error}
        </p>
      )}

      {removeState.success && (
        <p role="status" style={{ color: "#1F6B4E" }}>
          {removeState.success}
        </p>
      )}
    </div>
  );
}
