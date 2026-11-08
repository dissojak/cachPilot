
"use server";

import { auth } from "@/auth";
import { onboardingUseCases } from "@/container/onboarding";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type UpdateCompanyState = {
  error: string | null;
  success: boolean;
};

const updateCompanySchema = z.object({
  companyId: z.string().regex(/^[a-f0-9]{24}$/i),
  name: z.string().trim().min(2).max(100),
  sector: z.string().trim().min(2).max(100),
  forecastThreshold: z
    .string()
    .regex(/^\d{1,10}(?:\.\d{1,3})?$/),
});

function toMillimes(value: string): number {
  const [dinars, decimals = ""] = value.split(".");

  return (
    Number(dinars) * 1000 +
    Number(decimals.padEnd(3, "0"))
  );
}

export async function updateCompanyAction(
  _previousState: UpdateCompanyState,
  formData: FormData
): Promise<UpdateCompanyState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Authentication required.",
      success: false,
    };
  }

  const parsed = updateCompanySchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    sector: formData.get("sector"),
    forecastThreshold: formData.get("forecastThreshold"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid company information.",
      success: false,
    };
  }

  try {
    await onboardingUseCases.updateCompany.execute({
      userId: session.user.id,
      companyId: parsed.data.companyId,
      name: parsed.data.name,
      sector: parsed.data.sector,
      forecastThresholdMillimes: toMillimes(
        parsed.data.forecastThreshold
      ),
    });

    revalidatePath("/companies");
    revalidatePath(
      `/companies/${parsed.data.companyId}`
    );
    revalidatePath(
      `/companies/${parsed.data.companyId}/settings`
    );

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Company update failed:", error);

    return {
      error: "Unable to update company.",
      success: false,
    };
  }
}
