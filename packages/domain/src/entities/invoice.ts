import { InvoiceId } from "../value-objects/ids";
import { CompanyId } from "../value-objects/ids";
import { PartyId } from "../value-objects/ids";
import { InvoiceNumber } from "../value-objects/invoice-number";
import { DateOnly } from "../value-objects/date-only";
import { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type InvoiceStatus = "draft" | "validated" | "partially_paid" | "paid" | "cancelled";

export interface InvoiceLineProps {
  description: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export class Invoice {
  private constructor(
    readonly id: InvoiceId,
    private props: {
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
    },
  ) {}

  static create(input: {
    id?: InvoiceId;
    companyId: CompanyId;
    customerId: PartyId;
    number: InvoiceNumber;
    issueDate: DateOnly;
    dueDate: DateOnly;
    lines: InvoiceLineProps[];
  }) {
    const total = input.lines.reduce((sum, line) => sum.add(line.lineTotal), Money.of(0));
    return new Invoice(input.id ?? InvoiceId.next(), {
      companyId: input.companyId,
      customerId: input.customerId,
      number: input.number,
      status: "draft",
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lines: input.lines,
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
    lines: InvoiceLineProps[];
    total: Money;
    remaining: Money;
    cancelledReason?: string;
    cancelledBy?: string;
    cancelledAt?: DateOnly;
  }) {
    return new Invoice(input.id, input);
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

  cancel(hasPayments: boolean) {
    if (hasPayments) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_HAS_PAYMENTS, "Invoice with payments cannot be cancelled");
    }
    if (this.props.status === "paid" || this.props.status === "cancelled") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Invoice cannot be cancelled");
    }
    this.props.status = "cancelled";
  }

  applyPayment(amount: Money) {
    if (this.props.status !== "validated" && this.props.status !== "partially_paid") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_PAYABLE, "Invoice is not payable");
    }
    if (amount.isGreaterThan(this.props.remaining)) {
      throw new DomainError(DOMAIN_ERROR_CODES.PAYMENT_EXCEEDS_REMAINING, "Payment exceeds remaining amount");
    }
    this.props.remaining = this.props.remaining.subtract(amount);
    this.props.status = this.props.remaining.isZero() ? "paid" : "partially_paid";
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
    };
  }
}
