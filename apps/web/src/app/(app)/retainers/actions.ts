"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { useCases } from "@/container";
import { requireActor } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

function refresh() {
  for (const path of ["/retainers", "/invoices", "/forecast", "/dashboard"]) revalidatePath(path);
}

export async function createRetainerAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  const schema = z.object({
    customerId: fields.id, name: fields.text, amount: fields.amount,
    intervalDays: fields.positiveInt, nextGenerationDate: fields.date,
  });
  return runAction(schema, formData, async (input) => {
    await useCases.createRetainer.execute({
      userId: actor.userId, companyId: actor.companyId, customerId: input.customerId, name: input.name,
      amountMillimes: input.amount, intervalDays: input.intervalDays, nextGenerationDate: input.nextGenerationDate,
    });
    refresh();
    return "Retainer created.";
  });
}

export async function toggleRetainerAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ retainerId: fields.id, to: z.enum(["pause", "resume"]) }), formData, async ({ retainerId, to }) => {
    const input = { userId: actor.userId, companyId: actor.companyId, retainerId };
    if (to === "pause") await useCases.pauseRetainer.execute(input);
    else await useCases.resumeRetainer.execute(input);
    refresh();
  });
}

export async function generateRetainerInvoicesAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({}), formData, async () => {
    const result = await useCases.generateRetainerInvoices.execute({ userId: actor.userId, companyId: actor.companyId });
    refresh();
    const count = result.generatedInvoiceIds.length;
    return count === 0 ? "Nothing is due today." : `${count} invoice${count > 1 ? "s" : ""} generated and validated.`;
  });
}
