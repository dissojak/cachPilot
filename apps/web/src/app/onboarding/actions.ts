"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { useCases } from "@/container";
import { getActor, ACTIVE_COMPANY_COOKIE } from "@/lib/session";
import { runAction, fields } from "@/lib/action";
import type { ActionResult } from "@/lib/action";

/** Defense step 1: create a company with its opening balance; the creator becomes owner. */
export async function registerCompanyAction(_: ActionResult | null, formData: FormData) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  const schema = z.object({
    name: fields.text,
    sector: fields.text,
    openingBalance: z.string().transform((value, ctx) => {
      if (value.trim() === "0") return 0;
      const parsed = fields.amount.safeParse(value);
      if (!parsed.success) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter the cash you have today, like 5000" }); return z.NEVER; }
      return parsed.data;
    }),
    openingDate: fields.date,
  });
  return runAction(schema, formData, async (input) => {
    const { companyId } = await useCases.registerCompany.execute({
      userId: actor.userId, name: input.name, sector: input.sector, openingBalanceMillimes: input.openingBalance, openingDate: input.openingDate,
    });
    await rememberCompany(companyId);
    redirect("/dashboard");
  });
}

/** Company switcher: the cookie is only a preference, ResolveActor checks membership. */
export async function switchCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const actor = await getActor();
  if (!actor) redirect("/login");
  const mine = await useCases.listMyCompanies.execute({ userId: actor.userId });
  if (mine.some((company) => company.companyId === companyId)) await rememberCompany(companyId);
  redirect("/dashboard");
}

async function rememberCompany(companyId: string) {
  const store = await cookies();
  store.set(ACTIVE_COMPANY_COOKIE, companyId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 90 });
}
