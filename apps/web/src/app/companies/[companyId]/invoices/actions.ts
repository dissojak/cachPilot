"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import { requireCompanyActor } from "@/lib/company-actor";
import { onboardingUseCases } from "@/container/onboarding";

export type InvoiceActionState = {
  error: string | null;
  success: string | null;
};

// Zod v3 compatible
const objectIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i);

const createInvoiceSchema = z.object({
  companyId: objectIdSchema,
  customerId: objectIdSchema,

  number: z.string().trim().min(1).max(50),

  issueDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/
  ),

  dueDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/
  ),

  description: z.string().trim().min(1).max(300),

  quantity: z.coerce.number().int().min(1).max(100000),

  unitPrice: z.string().regex(
    /^\d{1,10}(?:\.\d{1,3})?$/
  ),
});

const validateInvoiceSchema = z.object({
  companyId: objectIdSchema,
  invoiceId: objectIdSchema,
});

// Converts a decimal dinar amount to integer millimes.
// Example: "125.500" -> 125500
function toMillimes(value: string): number {
  const [dinars, decimals = ""] = value.split(".");

  const result =
    Number(dinars) * 1000 +
    Number(decimals.padEnd(3, "0"));

  if (
    !Number.isSafeInteger(result) ||
    result <= 0
  ) {
    throw new Error("Invalid invoice amount");
  }

  return result;
}

function getInvoiceError(error: unknown): string {
  if (error instanceof DomainError) {
    if (error.code === DOMAIN_ERROR_CODES.ACCESS_DENIED) {
      return "Access denied.";
    }

    if (error.code === DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND) {
      return "Invoice not found.";
    }

    if (error.code === DOMAIN_ERROR_CODES.INVALID_TRANSITION) {
      return "This invoice cannot be validated.";
    }
  }

  if (error instanceof Error) {
    if (
      error.message.includes(
        "Customer not found in this company"
      )
    ) {
      return "Select an existing customer of this company.";
    }

    if (error.message.includes("E11000")) {
      return "This invoice number already exists.";
    }
  }

  console.error("Invoice operation failed:", error);

  return "Unable to complete the invoice operation.";
}

// CREATE DRAFT
export async function createInvoiceAction(
  _previousState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  const parsed = createInvoiceSchema.safeParse({
    companyId: formData.get("companyId"),
    customerId: formData.get("customerId"),
    number: formData.get("number"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid invoice information.",
      success: null,
    };
  }

  const actor = await requireCompanyActor(
    parsed.data.companyId
  );

  if (
    actor.role !== "owner" &&
    actor.role !== "finance_manager"
  ) {
    return {
      error: "You cannot create invoices.",
      success: null,
    };
  }

  try {
    const unitPriceMillimes = toMillimes(
      parsed.data.unitPrice
    );

    const amount =
      unitPriceMillimes * parsed.data.quantity;

    if (!Number.isSafeInteger(amount)) {
      return {
        error: "Invoice amount is too large.",
        success: null,
      };
    }

    await onboardingUseCases.createInvoiceDraft.execute({
      userId: actor.userId,
      companyId: actor.companyId,
      customerId: parsed.data.customerId,
      number: parsed.data.number,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      lines: [
        {
          description: parsed.data.description,
          quantity: parsed.data.quantity,
          unitPriceMillimes,
        },
      ],
    });

    revalidatePath(
      `/companies/${actor.companyId}/invoices`
    );

    return {
      error: null,
      success: "Invoice draft created successfully.",
    };
  } catch (error) {
    return {
      error: getInvoiceError(error),
      success: null,
    };
  }
}

// VALIDATE DRAFT
export async function validateInvoiceAction(
  _previousState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  const parsed = validateInvoiceSchema.safeParse({
    companyId: formData.get("companyId"),
    invoiceId: formData.get("invoiceId"),
  });

  if (!parsed.success) {
    return {
      error: "Invalid invoice or company.",
      success: null,
    };
  }

  const actor = await requireCompanyActor(
    parsed.data.companyId
  );

  if (
    actor.role !== "owner" &&
    actor.role !== "finance_manager"
  ) {
    return {
      error: "You cannot validate invoices.",
      success: null,
    };
  }

  try {
    await onboardingUseCases.validateInvoice.execute({
      userId: actor.userId,
      companyId: actor.companyId,
      invoiceId: parsed.data.invoiceId,
    });

    revalidatePath(
      `/companies/${actor.companyId}/invoices`
    );

    return {
      error: null,
      success: "Invoice validated successfully.",
    };
  } catch (error) {
    return {
      error: getInvoiceError(error),
      success: null,
    };
  }
}
