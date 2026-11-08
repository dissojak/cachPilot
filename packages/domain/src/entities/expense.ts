import { ExpenseId } from "../value-objects/ids";
import { CompanyId } from "../value-objects/ids";
import { UserId } from "../value-objects/ids";
import { DateOnly } from "../value-objects/date-only";
import { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type ExpenseStatus = "submitted" | "approved" | "refused" | "paid";

export class Expense {
  private constructor(
    readonly id: ExpenseId,
    private props: {
      companyId: CompanyId;
      submittedBy: UserId;
      category: string;
      description: string;
      amount: Money;
      expenseDate: DateOnly;
      receiptFileId?: string;
      status: ExpenseStatus;
      approval?: { approver: UserId; decisionDate: DateOnly; reason?: string };
      payment?: { paidBy: UserId; paidDate: DateOnly; amount: Money };
    },
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
    return new Expense(input.id ?? ExpenseId.next(), {
      ...input,
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
    payment?: { paidBy: UserId; paidDate: DateOnly; amount: Money };
  }) {
    return new Expense(input.id, input);
  }

  get companyId() { return this.props.companyId; }
  get status() { return this.props.status; }
  get amount() { return this.props.amount; }
  get expenseDate() { return this.props.expenseDate; }

  approve(approver: UserId, decisionDate: DateOnly, reason?: string) {
    if (this.props.status !== "submitted") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only submitted expenses can be approved");
    }
    this.props.status = "approved";
    this.props.approval = { approver, decisionDate, reason };
  }

  refuse(approver: UserId, decisionDate: DateOnly, reason?: string) {
    if (this.props.status !== "submitted") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only submitted expenses can be refused");
    }
    this.props.status = "refused";
    this.props.approval = { approver, decisionDate, reason };
  }

  markPaid(paidBy: UserId, paidDate: DateOnly, amount: Money) {
    if (this.props.status !== "approved") {
      throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_APPROVED, "Only approved expenses can be paid");
    }
    this.props.status = "paid";
    this.props.payment = { paidBy, paidDate, amount };
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
            amountMillimes: this.props.payment.amount.amount,
          }
        : undefined,
    };
  }
}
