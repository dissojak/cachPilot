"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { useCases } from "@/container";
import { requireActor } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

const lineSchema = z.object({
  customerId: fields.id,
  issueDate: fields.date,
  dueDate: fields.date,
  description: fields.text,
  quantity: fields.positiveInt,
  unitPrice: fields.amount,
});

function refreshMoneyPages(invoiceId?: string) {
  for (const path of ["/invoices", "/dashboard", "/forecast", "/cash", "/parties"]) revalidatePath(path);
  if (invoiceId) revalidatePath(`/invoices/${invoiceId}`);
}

export async function createInvoiceDraftAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(lineSchema, formData, async (input) => {
    const invoice = await useCases.createInvoiceDraft.execute({
      userId: actor.userId, companyId: actor.companyId, customerId: input.customerId,
      issueDate: input.issueDate, dueDate: input.dueDate,
      lines: [{ description: input.description, quantity: input.quantity, unitPriceMillimes: input.unitPrice }],
    });
    refreshMoneyPages();
    redirect(`/invoices/${invoice.id}`);
  });
}

export async function updateInvoiceDraftAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(lineSchema.extend({ invoiceId: fields.id }), formData, async (input) => {
    await useCases.updateInvoiceDraft.execute({
      userId: actor.userId, companyId: actor.companyId, invoiceId: input.invoiceId, customerId: input.customerId,
      issueDate: input.issueDate, dueDate: input.dueDate,
      lines: [{ description: input.description, quantity: input.quantity, unitPriceMillimes: input.unitPrice }],
    });
    refreshMoneyPages(input.invoiceId);
    redirect(`/invoices/${input.invoiceId}`);
  });
}

export async function validateInvoiceAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ invoiceId: fields.id }), formData, async ({ invoiceId }) => {
    await useCases.validateInvoice.execute({ userId: actor.userId, companyId: actor.companyId, invoiceId });
    refreshMoneyPages(invoiceId);
    return "Invoice validated: it now counts in the forecast.";
  });
}

export async function cancelInvoiceAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ invoiceId: fields.id, reason: fields.text }), formData, async ({ invoiceId, reason }) => {
    await useCases.cancelInvoice.execute({ userId: actor.userId, companyId: actor.companyId, invoiceId, reason });
    refreshMoneyPages(invoiceId);
    return "Invoice cancelled.";
  });
}

export async function recordPaymentAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  const schema = z.object({
    invoiceId: fields.id,
    operationId: fields.id,
    amount: fields.amount,
    paymentDate: fields.date,
    method: z.enum(["bank_transfer", "cash", "cheque", "card"]),
    note: fields.optionalText,
  });
  return runAction(schema, formData, async (input) => {
    const result = await useCases.recordPayment.execute({
      userId: actor.userId, companyId: actor.companyId, invoiceId: input.invoiceId, operationId: input.operationId,
      amountMillimes: input.amount, paymentDate: input.paymentDate, method: input.method, note: input.note,
    });
    refreshMoneyPages(input.invoiceId);
    return result.invoice.status === "paid" ? "Payment recorded: the invoice is fully paid." : "Payment recorded.";
  });
}
