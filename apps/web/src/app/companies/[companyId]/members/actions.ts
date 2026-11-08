
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import { requireCompanyActor } from "@/lib/company-actor";

import {
  findExistingUserByEmail,
  onboardingUseCases,
} from "@/container/onboarding";

// ========================================
// Shared Types
// ========================================

export type MemberActionState = {
  error: string | null;
  success: string | null;
};

export type InviteMemberState = MemberActionState;

// ========================================
// Validation
// ========================================

const objectIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i);

const inviteSchema = z.object({
  companyId: objectIdSchema,
  email: z.string().trim().email(),
  role: z.enum([
    "finance_manager",
    "collaborator",
  ]),
});

const changeRoleSchema = z.object({
  companyId: objectIdSchema,
  userId: objectIdSchema,
  role: z.enum([
    "finance_manager",
    "collaborator",
  ]),
});

const removeMemberSchema = z.object({
  companyId: objectIdSchema,
  userId: objectIdSchema,
});

// ========================================
// Error Handling
// ========================================

function getMemberError(error: unknown): string {
  if (error instanceof DomainError) {
    if (error.code === DOMAIN_ERROR_CODES.ACCESS_DENIED) {
      return "You do not have permission to perform this action.";
    }

    if (error.code === DOMAIN_ERROR_CODES.USER_NOT_FOUND) {
      return "User or membership not found.";
    }

    if (error.code === DOMAIN_ERROR_CODES.DUPLICATE_OPERATION) {
      return "This operation has already been performed or the member already has this role.";
    }
  }

  console.error("Member operation failed:", error);

  return "Unable to complete the operation.";
}

// ========================================
// 1. Add Member
// ========================================

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

  const actor = await requireCompanyActor(
    parsed.data.companyId
  );

  if (actor.role !== "owner") {
    return {
      error: "Only owners can add members.",
      success: null,
    };
  }

  try {
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
    return {
      error: getMemberError(error),
      success: null,
    };
  }
}

// ========================================
// 2. Change Member Role
// ========================================

export async function changeMemberRoleAction(
  _previousState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const parsed = changeRoleSchema.safeParse({
    companyId: formData.get("companyId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "Invalid member or role.",
      success: null,
    };
  }

  const actor = await requireCompanyActor(
    parsed.data.companyId
  );

  if (actor.role !== "owner") {
    return {
      error: "Only owners can change roles.",
      success: null,
    };
  }

  try {
    await onboardingUseCases.changeMemberRole.execute({
      actorUserId: actor.userId,
      companyId: actor.companyId,
      userId: parsed.data.userId,
      role: parsed.data.role,
    });

    revalidatePath(
      `/companies/${actor.companyId}/members`
    );

    revalidatePath(
      `/companies/${actor.companyId}`
    );

    return {
      error: null,
      success: "Member role updated successfully.",
    };
  } catch (error) {
    return {
      error: getMemberError(error),
      success: null,
    };
  }
}

// ========================================
// 3. Remove Member
// ========================================

export async function removeMemberAction(
  _previousState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const parsed = removeMemberSchema.safeParse({
    companyId: formData.get("companyId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      error: "Invalid member or company.",
      success: null,
    };
  }

  const actor = await requireCompanyActor(
    parsed.data.companyId
  );

  if (actor.role !== "owner") {
    return {
      error: "Only owners can remove members.",
      success: null,
    };
  }

  try {
    await onboardingUseCases.removeMember.execute({
      actorUserId: actor.userId,
      companyId: actor.companyId,
      userId: parsed.data.userId,
    });

    revalidatePath(
      `/companies/${actor.companyId}/members`
    );

    revalidatePath("/companies");

    return {
      error: null,
      success: "Member removed successfully.",
    };
  } catch (error) {
    return {
      error: getMemberError(error),
      success: null,
    };
  }
}
