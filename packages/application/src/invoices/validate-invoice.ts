import { CompanyId, InvoiceId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { AuditLogRepository } from "../ports/audit-log-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface ValidateInvoiceInput { userId: string; companyId: string; invoiceId: string; }

/** Draft → Validated: from now on the invoice counts as an expected receipt. */
export class ValidateInvoice {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ValidateInvoiceInput) {
    await authorize(this.memberships, input, "invoices.manage");
    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    invoice.validate();
    await this.invoices.save(invoice);
    await this.audit.append({
      companyId: input.companyId, actorId: input.userId, entityType: "invoice", entityId: input.invoiceId,
      action: "invoice.validated", after: invoice.snapshot(), at: this.clock.now().toISOString(),
    });
    return invoice.snapshot();
  }
}
