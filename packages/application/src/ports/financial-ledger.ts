import type { CashMovement, Expense, Invoice, Money, Payment } from "@cashpilot/domain";

/**
 * Every write that moves real money goes through this port (D4, BR-10, BR-17, BR-18).
 * Contract for every implementation:
 * - all-or-nothing: either every record is stored or none is;
 * - append-only: payments and cash movements are inserted, never overwritten;
 *   an id that already exists throws DUPLICATE_OPERATION (double submit);
 * - recordInvoicePayment throws CONCURRENT_UPDATE when the stored invoice
 *   remaining amount is not `expectedPreviousRemaining` (two payments at once).
 */
export interface FinancialLedger {
  recordInvoicePayment(input: {
    invoice: Invoice;
    expectedPreviousRemaining: Money;
    payment: Payment;
    movement: CashMovement;
  }): Promise<void>;
  recordExpensePayment(input: { expense: Expense; movement: CashMovement }): Promise<void>;
  recordMovement(movement: CashMovement): Promise<void>;
}
