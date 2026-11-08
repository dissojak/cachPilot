
"use server";

import { auth } from "@/auth";
import { onboardingUseCases } from "@/container/onboarding";
import { redirect } from "next/navigation";
import { z } from "zod";

export type CreateCompanyState = {
  error: string | null;
};

const companySchema = z.object({
  name: z.string().trim().min(2).max(100),
  sector: z.string().trim().min(2).max(100),
  openingBalance: z.string().regex(
    /^\d{1,10}(?:\.\d{1,3})?$/,
    "Enter a valid DNT amount with up to 3 decimals"
  ),
});

function toMillimes(value: string): number {
  const [dinars, decimals = ""] = value.split(".");

  return (
    Number(dinars) * 1000 +
    Number(decimals.padEnd(3, "0"))
  );
}

export async function createCompanyAction(
  _previousState: CreateCompanyState,
  formData: FormData
): Promise<CreateCompanyState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    sector: formData.get("sector"),
    openingBalance: formData.get("openingBalance"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ??
        "Invalid company information",
    };
  }

  let companyId: string;

  try {
    const result =
      await onboardingUseCases.registerCompany.execute({
        ownerUserId: session.user.id,
        name: parsed.data.name,
        sector: parsed.data.sector,
        openingBalanceMillimes: toMillimes(
          parsed.data.openingBalance
        ),
      });

    companyId = result.companyId;
  
} catch (error) {
  console.error("========== ONBOARDING ERROR ==========");

  if (error instanceof Error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  } else {
    console.error("Unknown error:", error);
  }

  console.error("======================================");

  return {
    error: "Unable to create your company.",
  };
}


  redirect(
    `/onboarding/complete?companyId=${encodeURIComponent(
      companyId
    )}`
  );
}
