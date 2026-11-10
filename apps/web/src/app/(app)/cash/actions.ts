"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { useCases } from "@/container";
import { requireActor } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

function refresh() {
  for (const path of ["/cash", "/dashboard", "/forecast"]) revalidatePath(path);
}

export async function setOpeningBalanceAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  const schema = z.object({
    amount: z.string().transform((value, ctx) => {
      const parsed = fields.amount.safeParse(value);
      if (value.trim() === "0") return 0;
      if (!parsed.success) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter an amount like 5000" }); return z.NEVER; }
      return parsed.data;
    }),
    openingDate: fields.date,
  });
  return runAction(schema, formData, async (input) => {
    await useCases.setOpeningBalance.execute({ userId: actor.userId, companyId: actor.companyId, amountMillimes: input.amount, openingDate: input.openingDate });
    refresh();
    return "Opening balance recorded.";
  });
}

export async function recordAdjustmentAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  const schema = z.object({ amount: fields.signedAmount, movementDate: fields.date, reason: fields.text });
  return runAction(schema, formData, async (input) => {
    await useCases.recordAdjustment.execute({
      userId: actor.userId, companyId: actor.companyId, amountMillimes: input.amount, movementDate: input.movementDate, reason: input.reason,
    });
    refresh();
    return "Adjustment recorded. The original movements are unchanged.";
  });
}
