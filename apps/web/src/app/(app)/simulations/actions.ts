"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { useCases } from "@/container";
import { requireActor } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

export async function createScenarioAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ name: fields.text, baseReferenceDate: fields.date }), formData, async (input) => {
    const scenario = await useCases.createScenario.execute({ userId: actor.userId, companyId: actor.companyId, ...input });
    revalidatePath("/simulations");
    redirect(`/simulations/${scenario.id}`);
  });
}

/** One schema per hypothesis type (shape only; the domain validates the rules). */
const hypothesisSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("client_delay"), scenarioId: fields.id, invoiceId: fields.id, delayDays: fields.positiveInt }),
  z.object({ type: z.literal("new_expense"), scenarioId: fields.id, amount: fields.amount, date: fields.date, label: fields.text }),
  z.object({ type: z.literal("extra_income"), scenarioId: fields.id, amount: fields.amount, date: fields.date, label: fields.text }),
]);

export async function addHypothesisAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(hypothesisSchema, formData, async (input) => {
    const hypothesis = input.type === "client_delay"
      ? { type: input.type, invoiceId: input.invoiceId, delayDays: input.delayDays }
      : { type: input.type, amountMillimes: input.amount, date: input.date, label: input.label };
    await useCases.addHypothesis.execute({ userId: actor.userId, companyId: actor.companyId, scenarioId: input.scenarioId, hypothesis });
    revalidatePath(`/simulations/${input.scenarioId}`);
    return "Hypothesis added. The real data did not change.";
  });
}

export async function removeHypothesisAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ scenarioId: fields.id, index: z.coerce.number().int().min(0) }), formData, async (input) => {
    await useCases.removeHypothesis.execute({ userId: actor.userId, companyId: actor.companyId, ...input });
    revalidatePath(`/simulations/${input.scenarioId}`);
  });
}
