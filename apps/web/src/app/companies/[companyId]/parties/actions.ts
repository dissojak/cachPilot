
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import { requireCompanyActor } from "@/lib/company-actor";
import { onboardingUseCases } from "@/container/onboarding";

export type CreatePartyState = {
  error: string | null;
  success: string | null;
};

const createPartySchema = z.object({
  companyId: z.string().regex(/^[a-f0-9]{24}$/i),

  type: z.enum(["customer", "supplier"]),

  name: z.string().trim().min(2).max(100),

  email: z.union([
    z.literal(""),
    z.string().email(),
  ]),

  phone: z.string().trim().max(30),
  address: z.string().trim().max(300),
});

export async function createPartyAction(
  _previousState: CreatePartyState,
  formData: FormData
): Promise<CreatePartyState> {

  const parsed = createPartySchema.safeParse({
    companyId: formData.get("companyId"),
    type: formData.get("type"),
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid customer or supplier information.",
      success: null,
    };
  }

  // Authentication + company membership
  const actor = await requireCompanyActor(
    parsed.data.companyId
  );

  if (
    actor.role !== "owner" &&
    actor.role !== "finance_manager"
  ) {
    return {
      error: "You do not have permission to create customers or suppliers.",
      success: null,
    };
  }

  try {
    await onboardingUseCases.createParty.execute({
      userId: actor.userId,
      companyId: actor.companyId,
      type: parsed.data.type,
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
    });

    revalidatePath(
      `/companies/${actor.companyId}/parties`
    );

    return {
      error: null,
      success:
        parsed.data.type === "customer"
          ? "Customer created successfully."
          : "Supplier created successfully.",
    };
  } catch (error) {
    if (
      error instanceof DomainError &&
      error.code === DOMAIN_ERROR_CODES.ACCESS_DENIED
    ) {
      return {
        error: "Access denied.",
        success: null,
      };
    }

    console.error("Create party failed:", error);

    return {
      error: "Unable to create customer or supplier.",
      success: null,
    };
  }
}
