import { connectDb, mongoose, InvoiceModel, PaymentModel, ExpenseModel, CashMovementModel } from "@cashpilot/db";
import { DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { CashMovement, Expense, Invoice, Money, Payment } from "@cashpilot/domain";
import type { FinancialLedger } from "@cashpilot/application";
import { invoiceMapper, paymentMapper, expenseMapper, cashMovementMapper } from "./mappers";

/**
 * D4/D5: money writes in one MongoDB transaction (Atlas is a replica set).
 * - inserts only (create), never upserts → a repeated id is a duplicate key;
 * - the invoice is updated only if its stored remaining amount is still the
 *   one the use case read → two simultaneous payments cannot overpay.
 */
export class MongoFinancialLedger implements FinancialLedger {
  async recordInvoicePayment(input: { invoice: Invoice; expectedPreviousRemaining: Money; payment: Payment; movement: CashMovement }) {
    await this.inTransaction(async (session) => {
      const doc = invoiceMapper.toDoc(input.invoice);
      const result = await InvoiceModel.replaceOne(
        { _id: doc._id, remainingMillimes: input.expectedPreviousRemaining.amount },
        doc,
        { session },
      );
      if (result.matchedCount === 0) {
        throw new DomainError(DOMAIN_ERROR_CODES.CONCURRENT_UPDATE, "The invoice changed meanwhile, please reload and retry");
      }
      await PaymentModel.create([paymentMapper.toDoc(input.payment)], { session });
      await CashMovementModel.create([cashMovementMapper.toDoc(input.movement)], { session });
    });
  }

  async recordExpensePayment(input: { expense: Expense; movement: CashMovement }) {
    await this.inTransaction(async (session) => {
      const doc = expenseMapper.toDoc(input.expense);
      // only an approved expense in the database may become paid (no double payment)
      const result = await ExpenseModel.replaceOne({ _id: doc._id, status: "approved" }, doc, { session });
      if (result.matchedCount === 0) {
        throw new DomainError(DOMAIN_ERROR_CODES.CONCURRENT_UPDATE, "The expense changed meanwhile, please reload and retry");
      }
      await CashMovementModel.create([cashMovementMapper.toDoc(input.movement)], { session });
    });
  }

  async recordMovement(movement: CashMovement) {
    await this.inTransaction(async (session) => {
      await CashMovementModel.create([cashMovementMapper.toDoc(movement)], { session });
    });
  }

  private async inTransaction(work: (session: mongoose.ClientSession) => Promise<void>) {
    await connectDb();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => work(session));
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new DomainError(DOMAIN_ERROR_CODES.DUPLICATE_OPERATION, "This operation was already recorded");
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
