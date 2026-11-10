import { CompanyId, UserId, InvoiceId, PaymentId, Payment, Money, CashMovement, CashMovementId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { FinancialLedger } from "../ports/financial-ledger";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { IdGenerator } from "../ports/id-generator";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { realizedDate } from "../access/dates";

export interface RecordPaymentInput {
  userId: string;
  companyId: string;
  invoiceId: string;
  /** Generated when the form is rendered: submitting twice is rejected (D5). */
  operationId: string;
  amountMillimes: number;
  paymentDate: string;
  method: string;
  note?: string;
}

/** BR-09/BR-10: a payment reduces the remaining amount and creates exactly one cash movement. */
export class RecordPayment {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly ledger: FinancialLedger,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RecordPaymentInput) {
    await authorize(this.memberships, input, "payments.record");
    const companyId = CompanyId.from(input.companyId);
    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(companyId)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    }

    const expectedPreviousRemaining = invoice.remaining;
    const amount = Money.positive(input.amountMillimes);
    invoice.applyPayment(amount);

    const payment = Payment.create({
      id: PaymentId.from(input.operationId),
      companyId,
      invoiceId: invoice.id,
      amount,
      paymentDate: realizedDate(input.paymentDate, this.clock),
      method: input.method,
      note: input.note,
      recordedBy: UserId.from(input.userId),
    });
    const movement = CashMovement.fromInvoicePayment({ id: CashMovementId.from(this.ids.newId()), payment });

    await this.ledger.recordInvoicePayment({ invoice, expectedPreviousRemaining, payment, movement });
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "invoice", entityId: input.invoiceId,
      action: "payment.recorded", after: payment.snapshot(), at: this.clock.now().toISOString(),
    });
    return { payment: payment.snapshot(), invoice: invoice.snapshot() };
  }
}
