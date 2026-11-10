import { CompanyId, InvoiceId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface GetInvoiceInput { userId: string; companyId: string; invoiceId: string; }

export class GetInvoice {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetInvoiceInput) {
    await authorize(this.memberships, input, "invoices.view");
    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    return { ...invoice.snapshot(), overdue: invoice.isOverdue(this.clock.today()) };
  }
}
