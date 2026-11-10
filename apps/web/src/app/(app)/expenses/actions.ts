"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { useCases } from "@/container";
import { requireActor } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

function refresh(expenseId?: string) {
  for (const path of ["/expenses", "/dashboard", "/forecast", "/cash"]) revalidatePath(path);
  if (expenseId) revalidatePath(`/expenses/${expenseId}`);
}

export async function submitExpenseAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  const schema = z.object({ category: fields.text, description: fields.text, amount: fields.amount, expenseDate: fields.date });
  return runAction(schema, formData, async (input) => {
    const expense = await useCases.submitExpense.execute({
      userId: actor.userId, companyId: actor.companyId, category: input.category, description: input.description,
      amountMillimes: input.amount, expenseDate: input.expenseDate,
    });
    const receipt = formData.get("receipt");
    if (receipt instanceof File && receipt.size > 0) {
      await useCases.attachReceipt.execute({
        userId: actor.userId, companyId: actor.companyId, expenseId: expense.id, fileName: receipt.name,
        content: new Uint8Array(await receipt.arrayBuffer()), contentType: receipt.type,
      });
    }
    refresh();
    redirect(`/expenses/${expense.id}`);
  });
}

export async function attachReceiptAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  const receipt = formData.get("receipt");
  return runAction(z.object({ expenseId: fields.id }), formData, async ({ expenseId }) => {
    if (!(receipt instanceof File) || receipt.size === 0) return "Choose a file first.";
    await useCases.attachReceipt.execute({
      userId: actor.userId, companyId: actor.companyId, expenseId, fileName: receipt.name,
      content: new Uint8Array(await receipt.arrayBuffer()), contentType: receipt.type,
    });
    refresh(expenseId);
    return "Receipt attached.";
  });
}

export async function approveExpenseAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ expenseId: fields.id }), formData, async ({ expenseId }) => {
    await useCases.approveExpense.execute({ userId: actor.userId, companyId: actor.companyId, expenseId });
    refresh(expenseId);
    return "Expense approved: it is now a planned payment in the forecast.";
  });
}

export async function refuseExpenseAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ expenseId: fields.id, reason: fields.text }), formData, async ({ expenseId, reason }) => {
    await useCases.refuseExpense.execute({ userId: actor.userId, companyId: actor.companyId, expenseId, reason });
    refresh(expenseId);
    return "Expense refused.";
  });
}

export async function markExpensePaidAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ expenseId: fields.id, paidDate: fields.date }), formData, async ({ expenseId, paidDate }) => {
    await useCases.markExpensePaid.execute({ userId: actor.userId, companyId: actor.companyId, expenseId, paidDate });
    refresh(expenseId);
    return "Expense paid: the real balance is updated.";
  });
}
