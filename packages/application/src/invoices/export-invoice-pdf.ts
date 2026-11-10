import { CompanyId, InvoiceId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { PaymentRepository } from "../ports/payment-repository";
import type { PartyRepository } from "../ports/party-repository";
import type { CompanyRepository } from "../ports/company-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { PdfExporter } from "../ports/pdf-exporter";
import { authorize } from "../access/authorize";

export interface ExportInvoicePdfInput { userId: string; companyId: string; invoiceId: string; }

export class ExportInvoicePdf {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
    private readonly parties: PartyRepository,
    private readonly companies: CompanyRepository,
    private readonly memberships: MembershipRepository,
    private readonly pdfExporter: PdfExporter,
  ) {}

  async execute(input: ExportInvoicePdfInput) {
    await authorize(this.memberships, input, "invoices.export");
    const companyId = CompanyId.from(input.companyId);
    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(companyId)) throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    const [company, customer, payments] = await Promise.all([
      this.companies.byId(companyId),
      this.parties.byId(invoice.customerId),
      this.payments.byInvoice(invoice.id),
    ]);
    const snapshot = invoice.snapshot();
    const customerDetails = customer?.snapshot();

    const pdf = await this.pdfExporter.exportInvoice({
      companyName: company?.name ?? "",
      customer: { name: customerDetails?.name ?? "Unknown customer", email: customerDetails?.email, address: customerDetails?.address },
      invoice: {
        number: snapshot.number,
        status: snapshot.status,
        issueDate: snapshot.issueDate,
        dueDate: snapshot.dueDate,
        lines: snapshot.lines,
        totalMillimes: snapshot.totalMillimes,
        remainingMillimes: snapshot.remainingMillimes,
      },
      payments: payments.map((payment) => payment.snapshot()).map((p) => ({ paymentDate: p.paymentDate, method: p.method, amountMillimes: p.amountMillimes })),
    });
    return { pdf, fileName: `${snapshot.number}.pdf` };
  }
}
