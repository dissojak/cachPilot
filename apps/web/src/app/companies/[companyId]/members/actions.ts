
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCompanyActor } from "@/lib/company-actor";

import {
  findExistingUserByEmail,
  onboardingUseCases,
} from "@/container/onboarding";

export type InviteMemberState = {
  error: string | null;
  success: string | null;
};

const inviteSchema = z.object({
  companyId: z.string().regex(/^[a-f0-9]{24}$/i),

  email: z.string().trim().email(),

  role: z.enum([
    "finance_manager",
    "collaborator",
  ]),
});

export async function inviteMemberAction(
  _previousState: InviteMemberState,
  formData: FormData
): Promise<InviteMemberState> {
  const parsed = inviteSchema.safeParse({
    companyId: formData.get("companyId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "Invalid email, role or company.",
      success: null,
    };
  }

  // Vérifier l'utilisateur connecté et son entreprise
  const actor = await requireCompanyActor(
    parsed.data.companyId
  );

  // Seul le propriétaire peut ajouter des membres
  if (actor.role !== "owner") {
    return {
      error: "Only owners can add members.",
      success: null,
    };
  }

  try {
    // Rechercher un utilisateur CashPilot existant
    const user = await findExistingUserByEmail(
      parsed.data.email
    );

    if (!user) {
      return {
        error:
          "User not found. The user must sign in to CashPilot first.",
        success: null,
      };
    }

    await onboardingUseCases.inviteMember.execute({
      actorUserId: actor.userId,
      companyId: actor.companyId,
      userId: user.id.value,
      role: parsed.data.role,
    });

    revalidatePath(
      `/companies/${actor.companyId}/members`
    );

    return {
      error: null,
      success: "Member added successfully.",
    };
  } catch (error) {
    console.error("Member addition failed:", error);

    return {
      error: "Unable to add member.",
      success: null,
    };
  }
}
