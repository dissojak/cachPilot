import { CompanyId, UserId, InvoiceId } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { PaymentRepository } from "../ports/payment-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface CancelInvoiceInput { userId: string; companyId: string; invoiceId: string; }

export class CancelInvoice {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
    private readonly memberships: MembershipRepository,
  ) {}
  async execute(input: CancelInvoiceInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    const payments = await this.payments.byInvoice(InvoiceId.from(input.invoiceId));
    invoice.cancel(payments.length > 0);
    await this.invoices.save(invoice);
    return invoice.snapshot();
  }
}
