import { ExpenseId } from "../value-objects/ids";
import type { CompanyId } from "../value-objects/ids";
import type { UserId } from "../value-objects/ids";
import type { DateOnly } from "../value-objects/date-only";
import type { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type ExpenseStatus = "submitted" | "approved" | "refused" | "paid";

interface ExpenseProps {
  companyId: CompanyId;
  submittedBy: UserId;
  category: string;
  description: string;
  amount: Money;
  expenseDate: DateOnly;
  receiptFileId?: string;
  status: ExpenseStatus;
  approval?: { approver: UserId; decisionDate: DateOnly; reason?: string };
  payment?: { paidBy: UserId; paidDate: DateOnly };
}

export class Expense {
  private constructor(
    readonly id: ExpenseId,
    private props: ExpenseProps,
  ) {}

  static create(input: {
    id?: ExpenseId;
    companyId: CompanyId;
    submittedBy: UserId;
    category: string;
    description: string;
    amount: Money;
    expenseDate: DateOnly;
    receiptFileId?: string;
  }) {
    const category = input.category.trim();
    const description = input.description.trim();
    if (category.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Expense category is required");
    }
    if (description.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Expense description is required");
    }
    if (!input.amount.isPositive()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Expense amount must be positive");
    }
    return new Expense(input.id ?? ExpenseId.next(), {
      ...input,
      category,
      description,
      status: "submitted",
    });
  }

  static restore(input: {
    id: ExpenseId;
    companyId: CompanyId;
    submittedBy: UserId;
    category: string;
    description: string;
    amount: Money;
    expenseDate: DateOnly;
    receiptFileId?: string;
    status: ExpenseStatus;
    approval?: { approver: UserId; decisionDate: DateOnly; reason?: string };
    payment?: { paidBy: UserId; paidDate: DateOnly; amount?: Money };
  }) {
    return new Expense(input.id, {
      companyId: input.companyId,
      submittedBy: input.submittedBy,
      category: input.category,
      description: input.description,
      amount: input.amount,
      expenseDate: input.expenseDate,
      receiptFileId: input.receiptFileId,
      status: input.status,
      approval: input.approval,
      payment: input.payment
        ? { paidBy: input.payment.paidBy, paidDate: input.payment.paidDate }
        : undefined,
    });
  }

  get companyId() { return this.props.companyId; }
  get submittedBy() { return this.props.submittedBy; }
  get status() { return this.props.status; }
  get amount() { return this.props.amount; }
  get expenseDate() { return this.props.expenseDate; }
  get description() { return this.props.description; }
  get receiptFileId() { return this.props.receiptFileId; }
  get payment() { return this.props.payment; }

  approve(approver: UserId, decisionDate: DateOnly, reason?: string) {
    if (this.props.status !== "submitted") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only submitted expenses can be approved");
    }
    this.props.status = "approved";
    this.props.approval = { approver, decisionDate, reason };
  }

  /** BR-14 path: a refused expense is frozen and can never be paid. */
  refuse(approver: UserId, decisionDate: DateOnly, reason: string) {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Refusal reason is required");
    }
    if (this.props.status !== "submitted") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only submitted expenses can be refused");
    }
    this.props.status = "refused";
    this.props.approval = { approver, decisionDate, reason: trimmed };
  }

  /**
   * Edits a submitted expense before a decision: only the submitter, or a
   * finance role (the use case passes canEditOthers from expenses.pay).
   * Re-applies the create invariants on the changed fields.
   */
  revise(by: UserId, canEditOthers: boolean, changes: { category?: string; description?: string; amount?: Money; expenseDate?: DateOnly }) {
    if (this.props.status !== "submitted") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only submitted expenses can be revised");
    }
    if (!by.equals(this.props.submittedBy) && !canEditOthers) {
      throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Only the submitter or a finance role can revise this expense");
    }
    if (changes.category !== undefined) {
      const category = changes.category.trim();
      if (category.length === 0) {
        throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Expense category is required");
      }
      this.props.category = category;
    }
    if (changes.description !== undefined) {
      const description = changes.description.trim();
      if (description.length === 0) {
        throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Expense description is required");
      }
      this.props.description = description;
    }
    if (changes.amount !== undefined) {
      if (!changes.amount.isPositive()) {
        throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Expense amount must be positive");
      }
      this.props.amount = changes.amount;
    }
    if (changes.expenseDate !== undefined) {
      this.props.expenseDate = changes.expenseDate;
    }
  }

  /** Receipts can be attached before or after approval, never after payment. */
  attachReceipt(fileId: string) {
    const trimmed = fileId.trim();
    if (trimmed.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Receipt file id is required");
    }
    if (this.props.status !== "submitted" && this.props.status !== "approved") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Receipt can only be attached to a submitted or approved expense");
    }
    this.props.receiptFileId = trimmed;
  }

  /** P2-8: pays exactly the approved amount — no amount argument. */
  markPaid(paidBy: UserId, paidDate: DateOnly) {
    if (this.props.status === "refused") {
      throw new DomainError(DOMAIN_ERROR_CODES.REFUSED_EXPENSE_CANNOT_BE_PAID, "A refused expense cannot be paid");
    }
    if (this.props.status === "paid") {
      throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_ALREADY_PAID, "Expense is already paid");
    }
    if (this.props.status !== "approved") {
      throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_APPROVED, "Only approved expenses can be paid");
    }
    this.props.status = "paid";
    this.props.payment = { paidBy, paidDate };
  }

  /** Forecast input (D7): an approved, not-yet-paid expense is a planned disbursement. */
  plannedDisbursement(): { expenseId: string; date: DateOnly; amount: Money } | null {
    if (this.props.status !== "approved") return null;
    return { expenseId: this.id.value, date: this.props.expenseDate, amount: this.props.amount };
  }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      submittedBy: this.props.submittedBy.value,
      category: this.props.category,
      description: this.props.description,
      amountMillimes: this.props.amount.amount,
      expenseDate: this.props.expenseDate.value,
      receiptFileId: this.props.receiptFileId,
      status: this.props.status,
      approval: this.props.approval
        ? {
            approver: this.props.approval.approver.value,
            decisionDate: this.props.approval.decisionDate.value,
            reason: this.props.approval.reason,
          }
        : undefined,
      payment: this.props.payment
        ? {
            paidBy: this.props.payment.paidBy.value,
            paidDate: this.props.payment.paidDate.value,
          }
        : undefined,
    };
  }
}
