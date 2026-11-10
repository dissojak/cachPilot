import { z } from "zod";
import { DomainError } from "@cashpilot/application";
import { errorMessage } from "./error-messages";
import { parseDntToMillimes } from "./money-input";
import { logger } from "@/container";

/** What every Server Action returns to its form (course s.31–32). */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

export const initialActionResult: ActionResult | null = null;

/**
 * Validates the form shape with Zod, runs the use case, and turns expected
 * domain errors into a message for the user. Anything else (bugs, database
 * down) is logged and re-thrown to error.tsx. redirect() also passes through.
 */
export async function runAction<S extends z.ZodTypeAny>(
  schema: S,
  formData: FormData,
  work: (input: z.infer<S>) => Promise<string | void>,
): Promise<ActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const message = await work(parsed.data);
    return { ok: true, message: message ?? undefined };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: errorMessage(error.code, error.message) };
    if (!isNextControlFlow(error)) logger.error("server action failed", { error: String(error) });
    throw error;
  }
}

function isNextControlFlow(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_");
}

/* Shape-only Zod fields shared by the forms (business rules stay in the domain). */
export const fields = {
  id: z.string().trim().min(1, "Required"),
  text: z.string().trim().min(1, "Required"),
  optionalText: z.string().trim().optional().transform((value) => value || undefined),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  /** "2,000.500" DNT typed by the user → integer millimes. */
  amount: z.string().transform((value, ctx) => {
    const millimes = parseDntToMillimes(value);
    if (millimes === null || millimes <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter an amount like 1250.500" });
      return z.NEVER;
    }
    return millimes;
  }),
  signedAmount: z.string().transform((value, ctx) => {
    const millimes = parseDntToMillimes(value, { allowNegative: true });
    if (millimes === null || millimes === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a non-zero amount, negative to remove cash" });
      return z.NEVER;
    }
    return millimes;
  }),
  positiveInt: z.coerce.number().int("Whole number").positive("Must be positive"),
  role: z.enum(["owner", "finance_manager", "collaborator"]),
};
