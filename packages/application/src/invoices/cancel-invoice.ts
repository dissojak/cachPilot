import { CompanyId, UserId, InvoiceId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { PaymentRepository } from "../ports/payment-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface CancelInvoiceInput { userId: string; companyId: string; invoiceId: string; reason: string; }

/** BR-06: an invoice with payments cannot be cancelled. The invoice is kept, never deleted. */
export class CancelInvoice {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CancelInvoiceInput) {
    await authorize(this.memberships, input, "invoices.manage");
    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    const payments = await this.payments.byInvoice(invoice.id);
    const before = invoice.status;
    invoice.cancel({
      hasPayments: payments.length > 0,
      by: UserId.from(input.userId),
      on: this.clock.today(),
      reason: input.reason,
    });
    await this.invoices.save(invoice);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "invoice", entityId: input.invoiceId,
      action: "invoice.cancelled", before, after: invoice.status, reason: input.reason, at: this.clock.now().toISOString(),
    });
    return invoice.snapshot();
  }
}
