"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { useCases, demo } from "@/container";

const moneySchema = z.coerce.number().int().positive();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function createInvoiceDraftAction(formData: FormData) {
  const parsed = z.object({
    customerId: z.string().min(1),
    number: z.string().min(1),
    issueDate: dateSchema,
    dueDate: dateSchema,
    description: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    unitPriceMillimes: moneySchema,
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.createInvoiceDraft.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    customerId: parsed.data.customerId,
    number: parsed.data.number,
    issueDate: parsed.data.issueDate,
    dueDate: parsed.data.dueDate,
    lines: [{ description: parsed.data.description, quantity: parsed.data.quantity, unitPriceMillimes: parsed.data.unitPriceMillimes }],
  });

  revalidatePath("/invoices");
  return;
}

export async function updateInvoiceDraftAction(formData: FormData) {
  const parsed = z.object({
    invoiceId: z.string().min(1),
    customerId: z.string().min(1),
    number: z.string().min(1),
    issueDate: dateSchema,
    dueDate: dateSchema,
    description: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    unitPriceMillimes: moneySchema,
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.updateInvoiceDraft.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    invoiceId: parsed.data.invoiceId,
    customerId: parsed.data.customerId,
    number: parsed.data.number,
    issueDate: parsed.data.issueDate,
    dueDate: parsed.data.dueDate,
    lines: [{ description: parsed.data.description, quantity: parsed.data.quantity, unitPriceMillimes: parsed.data.unitPriceMillimes }],
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${parsed.data.invoiceId}`);
}

export async function validateInvoiceAction(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  await useCases.validateInvoice.execute({ userId: demo.ownerUserId, companyId: demo.companyId, invoiceId });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return;
}

export async function cancelInvoiceAction(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  await useCases.cancelInvoice.execute({ userId: demo.ownerUserId, companyId: demo.companyId, invoiceId });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return;
}

export async function recordPaymentAction(formData: FormData) {
  const parsed = z.object({
    invoiceId: z.string().min(1),
    amountMillimes: moneySchema,
    paymentDate: dateSchema,
    method: z.string().min(1),
    note: z.string().optional(),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.recordPayment.execute({
    userId: demo.financeUserId,
    companyId: demo.companyId,
    invoiceId: parsed.data.invoiceId,
    amountMillimes: parsed.data.amountMillimes,
    paymentDate: parsed.data.paymentDate,
    method: parsed.data.method,
    note: parsed.data.note,
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${parsed.data.invoiceId}`);
  revalidatePath("/cash");
  revalidatePath("/dashboard");
  revalidatePath("/forecast");
  return;
}

export async function submitExpenseAction(formData: FormData) {
  const parsed = z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    amountMillimes: moneySchema,
    expenseDate: dateSchema,
    receiptFileId: z.string().optional(),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.submitExpense.execute({
    userId: demo.collaboratorUserId,
    companyId: demo.companyId,
    category: parsed.data.category,
    description: parsed.data.description,
    amountMillimes: parsed.data.amountMillimes,
    expenseDate: parsed.data.expenseDate,
    receiptFileId: parsed.data.receiptFileId,
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return;
}

export async function approveExpenseAction(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  await useCases.approveExpense.execute({
    actorUserId: demo.ownerUserId,
    companyId: demo.companyId,
    expenseId,
    decisionDate: new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${expenseId}`);
  revalidatePath("/dashboard");
  return;
}

export async function refuseExpenseAction(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  await useCases.refuseExpense.execute({
    actorUserId: demo.ownerUserId,
    companyId: demo.companyId,
    expenseId,
    decisionDate: new Date().toISOString().slice(0, 10),
    reason: "Not approved",
  });
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${expenseId}`);
  return;
}

export async function markExpensePaidAction(formData: FormData) {
  const parsed = z.object({
    expenseId: z.string().min(1),
    paidDate: dateSchema,
    amountMillimes: moneySchema.optional(),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.markExpensePaid.execute({
    userId: demo.financeUserId,
    companyId: demo.companyId,
    expenseId: parsed.data.expenseId,
    paidDate: parsed.data.paidDate,
    amountMillimes: parsed.data.amountMillimes,
  });

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${parsed.data.expenseId}`);
  revalidatePath("/cash");
  revalidatePath("/dashboard");
  revalidatePath("/forecast");
  return;
}

export async function createPartyAction(formData: FormData) {
  const parsed = z.object({
    type: z.enum(["customer", "supplier"]),
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.createParty.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    type: parsed.data.type,
    name: parsed.data.name,
    email: parsed.data.email || undefined,
    phone: parsed.data.phone,
    address: parsed.data.address,
  });

  revalidatePath("/parties");
  return;
}

export async function setOpeningBalanceAction(formData: FormData) {
  const amountMillimes = z.coerce.number().int().safeParse(formData.get("amountMillimes"));
  if (!amountMillimes.success) return;

  await useCases.setOpeningBalance.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    amountMillimes: amountMillimes.data,
  });

  revalidatePath("/cash");
  revalidatePath("/dashboard");
  revalidatePath("/forecast");
  return;
}

export async function recordAdjustmentAction(formData: FormData) {
  const parsed = z.object({
    amountMillimes: z.coerce.number().int(),
    movementDate: dateSchema,
    reason: z.string().min(1),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.recordAdjustment.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    amountMillimes: parsed.data.amountMillimes,
    movementDate: parsed.data.movementDate,
    reason: parsed.data.reason,
  });

  revalidatePath("/cash");
  revalidatePath("/dashboard");
  revalidatePath("/forecast");
  return;
}

export async function createScenarioAction(formData: FormData) {
  const parsed = z.object({
    name: z.string().min(1),
    baseReferenceDate: dateSchema,
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  const scenario = await useCases.createScenario.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    name: parsed.data.name,
    baseReferenceDate: parsed.data.baseReferenceDate,
  });

  revalidatePath("/simulations");
  return;
}

export async function addHypothesisAction(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const scenarioId = String(formData.get("scenarioId") ?? "");

  if (type === "client_delay") {
    await useCases.addHypothesis.execute({
      userId: demo.ownerUserId,
      companyId: demo.companyId,
      scenarioId,
      hypothesis: {
        type,
        invoiceId: String(formData.get("invoiceId") ?? ""),
        delayDays: Number(formData.get("delayDays") ?? 0),
      },
    });
  } else if (type === "new_expense") {
    await useCases.addHypothesis.execute({
      userId: demo.ownerUserId,
      companyId: demo.companyId,
      scenarioId,
      hypothesis: {
        type,
        amountMillimes: Number(formData.get("amountMillimes") ?? 0),
        plannedDate: String(formData.get("plannedDate") ?? ""),
        category: String(formData.get("category") ?? ""),
        description: String(formData.get("description") ?? ""),
      },
    });
  } else {
    await useCases.addHypothesis.execute({
      userId: demo.ownerUserId,
      companyId: demo.companyId,
      scenarioId,
      hypothesis: {
        type: "extra_income",
        amountMillimes: Number(formData.get("amountMillimes") ?? 0),
        expectedDate: String(formData.get("expectedDate") ?? ""),
        description: String(formData.get("description") ?? ""),
      },
    });
  }

  revalidatePath("/simulations");
  revalidatePath(`/simulations/${scenarioId}`);
  return;
}

export async function createRetainerAction(formData: FormData) {
  const parsed = z.object({
    customerId: z.string().min(1),
    name: z.string().min(1),
    amountMillimes: moneySchema,
    intervalDays: z.coerce.number().int().positive(),
    nextGenerationDate: dateSchema,
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return;

  await useCases.createRetainer.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    customerId: parsed.data.customerId,
    name: parsed.data.name,
    amountMillimes: parsed.data.amountMillimes,
    intervalDays: parsed.data.intervalDays,
    nextGenerationDate: parsed.data.nextGenerationDate,
  });

  revalidatePath("/invoices");
  return;
}

export async function generateRetainerInvoicesAction(formData: FormData) {
  const asOfDate = String(formData.get("asOfDate") ?? new Date().toISOString().slice(0, 10));
  await useCases.generateRetainerInvoices.execute({ userId: demo.ownerUserId, companyId: demo.companyId, asOfDate });
  revalidatePath("/invoices");
  revalidatePath("/retainers");
  revalidatePath("/forecast");
  return;
}
