"use client";

import { useEffect, useState } from "react";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { money, moneyInput, date } from "@/lib/format";
import { removeHypothesisAction, updateHypothesisAction } from "../actions";

export type WhatIfData = {
  index: number;
  type: "client_delay" | "new_expense" | "extra_income";
  /** What to show in the table (for a delay: "Invoice INV-0001 paid 10 days late"). */
  title: string;
  /** What the person typed (expense / income only). */
  label: string;
  invoiceId?: string;
  delayDays?: number;
  /** Positive amount as stored. */
  amountMillimes: number;
  date: string;
  note?: string;
};

/**
 * One what-if line of the timeline. "Edit" opens a form right under the line,
 * prefilled with the current values; saving rewrites the same hypothesis.
 */
export function WhatIfRow({ scenarioId, data, signedMillimes, balanceMillimes, invoiceOptions }: {
  scenarioId: string;
  data: WhatIfData;
  signedMillimes: number;
  balanceMillimes: number | undefined;
  invoiceOptions: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  // once the server sends new values, the edit is done: fold the form
  const signature = JSON.stringify(data);
  useEffect(() => setEditing(false), [signature]);

  const key = `edit-${data.index}`;
  const short = balanceMillimes !== undefined && balanceMillimes < 0;

  return (
    <>
      <tr className={`row-whatif${short ? " row-short" : ""}`}>
        <td className="timeline-date">{date(data.date)}</td>
        <td>
          <span className="timeline-label">
            <span className="chip chip-warning">What-if</span>
            {data.title}
            {data.note && <span className="timeline-note">{data.note}</span>}
          </span>
        </td>
        <td className={`num ${signedMillimes < 0 ? "amount-out" : "amount-in"}`}>{signedMillimes > 0 ? "+" : ""}{money(signedMillimes)}</td>
        <td className={`num ${short ? "amount-out" : ""}`}>{balanceMillimes === undefined ? "—" : money(balanceMillimes)}</td>
        <td className="num">
          <span className="row-actions">
            <button type="button" className="btn btn-secondary btn-small" aria-expanded={editing} onClick={() => setEditing((open) => !open)}>
              {editing ? "Close" : "Edit"}
            </button>
            <ActionForm action={removeHypothesisAction} className="inline-form">
              <input type="hidden" name="scenarioId" value={scenarioId} />
              <input type="hidden" name="index" value={data.index} />
              <SubmitButton variant="secondary" small>Remove</SubmitButton>
            </ActionForm>
          </span>
        </td>
      </tr>
      {editing && (
        <tr className="row-edit">
          <td colSpan={5}>
            <ActionForm action={updateHypothesisAction} className="edit-form">
              <input type="hidden" name="scenarioId" value={scenarioId} />
              <input type="hidden" name="index" value={data.index} />
              {data.type === "client_delay" ? (
                <div className="edit-grid">
                  <input type="hidden" name="type" value="client_delay" />
                  <SelectField id={`${key}-invoice`} label="Invoice" name="invoiceId" options={invoiceOptions} defaultValue={data.invoiceId} />
                  <Field id={`${key}-delay`} label="Delay (days)" name="delayDays" type="number" min={1} max={365} defaultValue={data.delayDays} required />
                </div>
              ) : (
                <div className="edit-grid">
                  <SelectField id={`${key}-type`} label="Kind" name="type" defaultValue={data.type} options={[{ value: "new_expense", label: "New expense" }, { value: "extra_income", label: "Extra income" }]} />
                  <Field id={`${key}-label`} label="Label" name="label" defaultValue={data.label} required />
                  <Field id={`${key}-amount`} label="Amount (DNT)" name="amount" inputMode="decimal" defaultValue={moneyInput(data.amountMillimes)} required />
                  <Field id={`${key}-date`} label="Date" name="date" type="date" defaultValue={data.date} required />
                </div>
              )}
              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <SubmitButton>Save changes</SubmitButton>
              </div>
            </ActionForm>
          </td>
        </tr>
      )}
    </>
  );
}
