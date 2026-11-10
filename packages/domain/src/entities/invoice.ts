import { InvoiceId } from "../value-objects/ids";
import type { CompanyId } from "../value-objects/ids";
import type { PartyId } from "../value-objects/ids";
import type { UserId } from "../value-objects/ids";
import type { InvoiceNumber } from "../value-objects/invoice-number";
import type { DateOnly } from "../value-objects/date-only";
import { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type InvoiceStatus = "draft" | "validated" | "partially_paid" | "paid" | "cancelled";

/** Callers pass description/quantity/unitPrice; the entity computes the line total. */
export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: Money;
}

export interface InvoiceLineProps {
  description: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

interface InvoiceProps {
  companyId: CompanyId;
  customerId: PartyId;
  number: InvoiceNumber;
  status: InvoiceStatus;
  issueDate: DateOnly;
  dueDate: DateOnly;
  lines: InvoiceLineProps[];
  total: Money;
  remaining: Money;
  cancelledReason?: string;
  cancelledBy?: string;
  cancelledAt?: DateOnly;
}

function buildLines(input: readonly InvoiceLineInput[]): InvoiceLineProps[] {
  if (input.length === 0) {
    throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "An invoice needs at least one line");
  }
  return input.map((line) => {
    const description = line.description.trim();
    if (description.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Line description is required");
    }
    if (!line.unitPrice.isPositive()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Unit price must be positive");
    }
    return {
      description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.unitPrice.multiply(line.quantity),
    };
  });
}

function totalOf(lines: readonly InvoiceLineProps[]): Money {
  return lines.reduce((sum, line) => sum.add(line.lineTotal), Money.zero());
}

export class Invoice {
  private constructor(
    readonly id: InvoiceId,
    private props: InvoiceProps,
  ) {}

  static create(input: {
    id?: InvoiceId;
    companyId: CompanyId;
    customerId: PartyId;
    number: InvoiceNumber;
    issueDate: DateOnly;
    dueDate: DateOnly;
    lines: readonly InvoiceLineInput[];
  }) {
    if (input.dueDate.isBefore(input.issueDate)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Due date cannot be before the issue date");
    }
    const lines = buildLines(input.lines);
    const total = totalOf(lines);
    if (!total.isPositive()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Invoice total must be positive");
    }
    return new Invoice(input.id ?? InvoiceId.next(), {
      companyId: input.companyId,
      customerId: input.customerId,
      number: input.number,
      status: "draft",
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lines,
      total,
      remaining: total,
    });
  }

  static restore(input: {
    id: InvoiceId;
    companyId: CompanyId;
    customerId: PartyId;
    number: InvoiceNumber;
    status: InvoiceStatus;
    issueDate: DateOnly;
    dueDate: DateOnly;
    lines: readonly InvoiceLineInput[];
    total: Money;
    remaining: Money;
    cancelledReason?: string;
    cancelledBy?: string;
    cancelledAt?: DateOnly;
  }) {
    return new Invoice(input.id, {
      companyId: input.companyId,
      customerId: input.customerId,
      number: input.number,
      status: input.status,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lines: buildLines(input.lines),
      total: input.total,
      remaining: input.remaining,
      cancelledReason: input.cancelledReason,
      cancelledBy: input.cancelledBy,
      cancelledAt: input.cancelledAt,
    });
  }

  get companyId() { return this.props.companyId; }
  get customerId() { return this.props.customerId; }
  get number() { return this.props.number; }
  get status() { return this.props.status; }
  get issueDate() { return this.props.issueDate; }
  get dueDate() { return this.props.dueDate; }
  get lines() { return this.props.lines; }
  get total() { return this.props.total; }
  get remaining() { return this.props.remaining; }

  validate() {
    if (this.props.status !== "draft") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only draft invoices can be validated");
    }
    this.props.status = "validated";
  }

  /**
   * Edits a draft in place (BR-04: drafts only) and re-applies every invariant,
   * recomputing the total and the remaining amount.
   */
  reviseDraft(changes: {
    customerId?: PartyId;
    issueDate?: DateOnly;
    dueDate?: DateOnly;
    lines?: readonly InvoiceLineInput[];
  }) {
    if (this.props.status !== "draft") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only draft invoices can be revised");
    }
    const issueDate = changes.issueDate ?? this.props.issueDate;
    const dueDate = changes.dueDate ?? this.props.dueDate;
    if (dueDate.isBefore(issueDate)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Due date cannot be before the issue date");
    }
    const lines = buildLines(changes.lines ?? this.props.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })));
    const total = totalOf(lines);
    if (!total.isPositive()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Invoice total must be positive");
    }
    this.props.customerId = changes.customerId ?? this.props.customerId;
    this.props.issueDate = issueDate;
    this.props.dueDate = dueDate;
    this.props.lines = lines;
    this.props.total = total;
    this.props.remaining = total;
  }

  /** BR-06: an invoice with recorded payments can no longer be cancelled. */
  cancel(input: { hasPayments: boolean; by: UserId; on: DateOnly; reason: string }) {
    const reason = input.reason.trim();
    if (reason.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Cancellation reason is required");
    }
    if (input.hasPayments) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_HAS_PAYMENTS, "Invoice with payments cannot be cancelled");
    }
    if (this.props.status !== "draft" && this.props.status !== "validated") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only draft or validated invoices can be cancelled");
    }
    this.props.status = "cancelled";
    this.props.cancelledBy = input.by.value;
    this.props.cancelledAt = input.on;
    this.props.cancelledReason = reason;
  }

  applyPayment(amount: Money) {
    if (!amount.isPositive()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_MONEY_AMOUNT, "Payment amount must be positive");
    }
    if (this.props.status === "paid") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_ALREADY_PAID, "Invoice is already fully paid");
    }
    if (this.props.status !== "validated" && this.props.status !== "partially_paid") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_PAYABLE, "Invoice is not payable");
    }
    if (amount.isGreaterThan(this.props.remaining)) {
      throw new DomainError(DOMAIN_ERROR_CODES.PAYMENT_EXCEEDS_REMAINING, "Payment exceeds remaining amount");
    }
    this.props.remaining = this.props.remaining.subtract(amount);
    this.props.status = this.props.remaining.isZero() ? "paid" : "partially_paid";
  }

  /** BR-05: overdue = validated/partially_paid, due date passed, and money still owed. */
  isOverdue(today: DateOnly): boolean {
    return (this.props.status === "validated" || this.props.status === "partially_paid")
      && this.props.dueDate.isBefore(today)
      && this.props.remaining.isPositive();
  }

  /** Forecast input (D7): remaining amount of a validated/partially paid invoice, at its due date. */
  expectedReceipt(): { invoiceId: string; dueDate: DateOnly; amount: Money } | null {
    if (this.props.status !== "validated" && this.props.status !== "partially_paid") return null;
    if (!this.props.remaining.isPositive()) return null;
    return { invoiceId: this.id.value, dueDate: this.props.dueDate, amount: this.props.remaining };
  }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      customerId: this.props.customerId.value,
      number: this.props.number.value,
      status: this.props.status,
      issueDate: this.props.issueDate.value,
      dueDate: this.props.dueDate.value,
      lines: this.props.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPriceMillimes: line.unitPrice.amount,
        lineTotalMillimes: line.lineTotal.amount,
      })),
      totalMillimes: this.props.total.amount,
      remainingMillimes: this.props.remaining.amount,
      cancelledReason: this.props.cancelledReason,
      cancelledBy: this.props.cancelledBy,
      cancelledAt: this.props.cancelledAt?.value,
    };
  }
}
