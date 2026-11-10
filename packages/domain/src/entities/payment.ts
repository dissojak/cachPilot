import { PaymentId } from "../value-objects/ids";
import type { CompanyId } from "../value-objects/ids";
import type { InvoiceId } from "../value-objects/ids";
import type { UserId } from "../value-objects/ids";
import type { DateOnly } from "../value-objects/date-only";
import type { Money } from "../value-objects/money";

export class Payment {
  private constructor(
    readonly id: PaymentId,
    private props: {
      companyId: CompanyId;
      invoiceId: InvoiceId;
      amount: Money;
      paymentDate: DateOnly;
      method: string;
      note?: string;
      recordedBy: UserId;
    },
  ) {}

  static create(input: {
    id?: PaymentId;
    companyId: CompanyId;
    invoiceId: InvoiceId;
    amount: Money;
    paymentDate: DateOnly;
    method: string;
    note?: string;
    recordedBy: UserId;
  }) {
    return new Payment(input.id ?? PaymentId.next(), input);
  }

  static restore(input: {
    id: PaymentId;
    companyId: CompanyId;
    invoiceId: InvoiceId;
    amount: Money;
    paymentDate: DateOnly;
    method: string;
    note?: string;
    recordedBy: UserId;
  }) {
    return new Payment(input.id, input);
  }

  get companyId() { return this.props.companyId; }
  get invoiceId() { return this.props.invoiceId; }
  get amount() { return this.props.amount; }
  get paymentDate() { return this.props.paymentDate; }
  get recordedBy() { return this.props.recordedBy; }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      invoiceId: this.props.invoiceId.value,
      amountMillimes: this.props.amount.amount,
      paymentDate: this.props.paymentDate.value,
      method: this.props.method,
      note: this.props.note,
      recordedBy: this.props.recordedBy.value,
    };
  }
}
