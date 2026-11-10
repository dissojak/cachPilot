import type { CashMovementId, CompanyId, UserId } from "../value-objects/ids";
import type { DateOnly } from "../value-objects/date-only";
import type { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";
import type { Payment } from "./payment";
import type { Expense } from "./expense";

export type CashMovementType = "opening" | "invoice_payment" | "expense_payment" | "adjustment" | "reversal";

/**
 * The only source of the real balance (BR-17): every realized operation is
 * exactly one immutable signed movement. Factories carry intent instead of a
 * free `type` string, so an amount's sign can never contradict its type.
 * Movements are append-only (BR-19): a correction is a new linked movement,
 * never an edit of an existing one.
 */
interface CashMovementProps {
  companyId: CompanyId;
  type: CashMovementType;
  /** Signed: positive brings cash in, negative takes cash out. */
  amount: Money;
  movementDate: DateOnly;
  sourceType: string;
  sourceId: string;
  actorId: UserId;
  reason?: string;
  /** Set on a reversal: the movement that is being corrected. */
  reversesId?: CashMovementId;
}

export class CashMovement {
  private constructor(
    readonly id: CashMovementId,
    private props: CashMovementProps,
  ) {}

  /** Initial balance of a company: a non-negative cash-in movement (D2). */
  static opening(input: {
    id: CashMovementId;
    companyId: CompanyId;
    actorId: UserId;
    date: DateOnly;
    amount: Money;
  }) {
    if (input.amount.isNegative()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Opening balance cannot be negative");
    }
    return new CashMovement(input.id, {
      companyId: input.companyId,
      type: "opening",
      amount: input.amount,
      movementDate: input.date,
      sourceType: "opening",
      sourceId: input.companyId.value,
      actorId: input.actorId,
      reason: "Opening balance",
    });
  }

  /** A recorded invoice payment brings the paid amount in. */
  static fromInvoicePayment(input: { id: CashMovementId; payment: Payment }) {
    return new CashMovement(input.id, {
      companyId: input.payment.companyId,
      type: "invoice_payment",
      amount: input.payment.amount,
      movementDate: input.payment.paymentDate,
      sourceType: "payment",
      sourceId: input.payment.id.value,
      actorId: input.payment.recordedBy,
    });
  }

  /** A paid expense takes the expense amount out. */
  static fromExpensePayment(input: { id: CashMovementId; expense: Expense }) {
    if (input.expense.status !== "paid") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only a paid expense creates an expense payment movement");
    }
    const payment = input.expense.payment!;
    return new CashMovement(input.id, {
      companyId: input.expense.companyId,
      type: "expense_payment",
      amount: input.expense.amount.negate(),
      movementDate: payment.paidDate,
      sourceType: "expense",
      sourceId: input.expense.id.value,
      actorId: payment.paidBy,
    });
  }

  /** Manual balance correction (P2-9): never zero, always with a reason. */
  static adjustment(input: {
    id: CashMovementId;
    companyId: CompanyId;
    actorId: UserId;
    date: DateOnly;
    amount: Money;
    reason: string;
  }) {
    const reason = input.reason.trim();
    if (input.amount.isZero()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "An adjustment amount cannot be zero");
    }
    if (reason.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "An adjustment needs a reason");
    }
    return new CashMovement(input.id, {
      companyId: input.companyId,
      type: "adjustment",
      amount: input.amount,
      movementDate: input.date,
      sourceType: "adjustment",
      sourceId: input.id.value,
      actorId: input.actorId,
      reason,
    });
  }

  /** BR-19 branch of a correction: reverts an existing movement, with a reason. */
  static reversal(input: {
    id: CashMovementId;
    original: CashMovement;
    actorId: UserId;
    date: DateOnly;
    reason: string;
  }) {
    const reason = input.reason.trim();
    if (reason.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "A reversal needs a reason");
    }
    return new CashMovement(input.id, {
      companyId: input.original.companyId,
      type: "reversal",
      amount: input.original.amount.negate(),
      movementDate: input.date,
      sourceType: "reversal",
      sourceId: input.original.id.value,
      actorId: input.actorId,
      reason,
      reversesId: input.original.id,
    });
  }

  static restore(input: {
    id: CashMovementId;
    companyId: CompanyId;
    type: CashMovementType;
    amount: Money;
    movementDate: DateOnly;
    sourceType: string;
    sourceId: string;
    actorId: UserId;
    reason?: string;
    reversesId?: CashMovementId;
  }) {
    return new CashMovement(input.id, {
      companyId: input.companyId,
      type: input.type,
      amount: input.amount,
      movementDate: input.movementDate,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      actorId: input.actorId,
      reason: input.reason,
      reversesId: input.reversesId,
    });
  }

  get companyId() { return this.props.companyId; }
  get type() { return this.props.type; }
  get amount() { return this.props.amount; }
  get movementDate() { return this.props.movementDate; }
  get reversesId() { return this.props.reversesId; }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      type: this.props.type,
      amountMillimes: this.props.amount.amount,
      movementDate: this.props.movementDate.value,
      sourceType: this.props.sourceType,
      sourceId: this.props.sourceId,
      actorId: this.props.actorId.value,
      reason: this.props.reason,
      reversesId: this.props.reversesId?.value,
    };
  }
}
