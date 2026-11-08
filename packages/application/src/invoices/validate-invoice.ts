import { CompanyId, UserId, InvoiceId, DomainError,DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { MembershipRepository } from "../ports/membership-repository";


export interface ValidateInvoiceInput { userId: string; companyId: string; invoiceId: string; }

export class ValidateInvoice {
  constructor(private readonly invoices: InvoiceRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ValidateInvoiceInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    
if (
  membership.role !== "owner" &&
  membership.role !== "finance_manager"
) {
  throw new DomainError(
    DOMAIN_ERROR_CODES.ACCESS_DENIED,
    "Only owner and finance manager can validate invoices"
  );
}

    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    invoice.validate();
    await this.invoices.save(invoice);
    return invoice.snapshot();
  }
}
