"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { useCases } from "@/container";
import { requireActor } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

export async function updateCompanyAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  const schema = z.object({ name: fields.text, sector: fields.text, threshold: z.string().transform((v, ctx) => {
    if (v.trim() === "" || v.trim() === "0") return 0;
    const parsed = fields.amount.safeParse(v);
    if (!parsed.success) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter an amount like 1000" }); return z.NEVER; }
    return parsed.data;
  }) });
  return runAction(schema, formData, async (input) => {
    await useCases.updateCompany.execute({
      userId: actor.userId, companyId: actor.companyId, name: input.name, sector: input.sector, forecastThresholdMillimes: input.threshold,
    });
    revalidatePath("/", "layout");
    return "Company saved.";
  });
}

export async function inviteMemberAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ email: z.string().trim().email("Enter a valid e-mail"), role: fields.role }), formData, async (input) => {
    await useCases.inviteMember.execute({ userId: actor.userId, companyId: actor.companyId, ...input });
    revalidatePath("/settings/members");
    return `${input.email} added to the company.`;
  });
}

export async function changeMemberRoleAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ memberUserId: fields.id, role: fields.role }), formData, async (input) => {
    await useCases.changeMemberRole.execute({ userId: actor.userId, companyId: actor.companyId, ...input });
    revalidatePath("/settings/members");
    return "Role updated.";
  });
}

export async function removeMemberAction(_: ActionResult | null, formData: FormData) {
  const actor = await requireActor();
  return runAction(z.object({ memberUserId: fields.id }), formData, async (input) => {
    await useCases.removeMember.execute({ userId: actor.userId, companyId: actor.companyId, ...input });
    revalidatePath("/settings/members");
    return "Member removed.";
  });
}
