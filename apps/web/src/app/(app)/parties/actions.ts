"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { useCases } from "@/container";
import { requireActor } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

const partySchema = z.object({
  type: z.enum(["customer", "supplier"]),
  name: fields.text,
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid e-mail")]).optional().transform((v) => v || undefined),
  phone: fields.optionalText,
  address: fields.optionalText,
});

export async function createPartyAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(partySchema, formData, async (input) => {
    await useCases.createParty.execute({ userId: actor.userId, companyId: actor.companyId, ...input });
    revalidatePath("/parties");
    return `${input.name} added.`;
  });
}

export async function updatePartyAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(partySchema.extend({ partyId: fields.id }), formData, async ({ partyId, ...input }) => {
    await useCases.updateParty.execute({ userId: actor.userId, companyId: actor.companyId, partyId, ...input });
    revalidatePath("/parties");
    revalidatePath(`/parties/${partyId}`);
    return "Saved.";
  });
}
