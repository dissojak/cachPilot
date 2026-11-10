import type { DomainErrorCode } from "@cashpilot/application";

/**
 * Presentation decides the wording (course s.32): the domain only gives a code.
 * Exhaustive Record: a new error code will not compile until it gets a message.
 */
const messages: Record<DomainErrorCode, string> = {
  ACCESS_DENIED: "Your role does not allow this action.",
  INVALID_TRANSITION: "This action is not possible in the current status.",
  INVALID_MONEY_AMOUNT: "The amount is not valid.",
  CURRENCY_MISMATCH: "Amounts must be in the same currency.",
  INVOICE_NOT_FOUND: "This invoice does not exist.",
  INVOICE_NOT_PAYABLE: "Only validated invoices can receive payments.",
  INVOICE_ALREADY_PAID: "This invoice is already fully paid.",
  INVOICE_HAS_PAYMENTS: "An invoice with payments cannot be cancelled.",
  PAYMENT_EXCEEDS_REMAINING: "The payment is larger than the remaining amount.",
  DUPLICATE_OPERATION: "This operation was already recorded.",
  EXPENSE_NOT_FOUND: "This expense does not exist.",
  EXPENSE_NOT_APPROVED: "Only an approved expense can be paid.",
  EXPENSE_ALREADY_PAID: "This expense is already paid.",
  REFUSED_EXPENSE_CANNOT_BE_PAID: "A refused expense can never be paid.",
  COMPANY_NOT_FOUND: "This company does not exist.",
  USER_NOT_FOUND: "No account found.",
  SCENARIO_HYPOTHESIS_INVALID: "This hypothesis is not valid.",
  INVALID_INPUT: "Some information is missing or not valid.",
  INVALID_DATE: "The date is not valid.",
  INVALID_EMAIL: "The e-mail address is not valid.",
  INVALID_ID: "Unknown reference.",
  PARTY_NOT_FOUND: "This customer or supplier does not exist.",
  SCENARIO_NOT_FOUND: "This scenario does not exist.",
  RETAINER_NOT_FOUND: "This retainer does not exist.",
  MEMBERSHIP_NOT_FOUND: "This person is not a member.",
  LAST_OWNER: "The company must keep at least one owner.",
  OPENING_BALANCE_ALREADY_SET: "The opening balance is already set. Record an adjustment instead.",
  CONCURRENT_UPDATE: "Someone changed this meanwhile. Reload the page and try again.",
};

/** The domain message is more precise for validation errors; the table covers the rest. */
export function errorMessage(code: DomainErrorCode, detail: string) {
  if (code === "INVALID_INPUT" || code === "INVALID_DATE" || code === "SCENARIO_HYPOTHESIS_INVALID" || code === "USER_NOT_FOUND") {
    return detail || messages[code];
  }
  return messages[code];
}
