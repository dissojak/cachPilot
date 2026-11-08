import { CompanyId, UserId, InvoiceId } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { PdfExporter } from "../ports/pdf-exporter";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ExportInvoicePdfInput { userId: string; companyId: string; invoiceId: string; }

export class ExportInvoicePdf {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
    private readonly pdfExporter: PdfExporter,
  ) {}

  async execute(input: ExportInvoicePdfInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    const pdf = await this.pdfExporter.exportInvoice({ invoiceId: input.invoiceId });
    return { pdf };
  }
}
