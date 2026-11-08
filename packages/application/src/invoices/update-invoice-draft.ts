import { CompanyId, UserId, PartyId, Invoice, InvoiceId, InvoiceNumber, DateOnly, Money, InvoiceLineProps } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface UpdateInvoiceDraftInput {
  userId: string;
  companyId: string;
  invoiceId: string;
  customerId?: string;
  number?: string;
  issueDate?: string;
  dueDate?: string;
  lines?: { description: string; quantity: number; unitPriceMillimes: number }[];
}

export class UpdateInvoiceDraft {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: UpdateInvoiceDraftInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    }
    if (invoice.status !== "draft") {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only draft invoices can be updated");
    }

    const sourceLines = input.lines ?? invoice.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPriceMillimes: line.unitPrice.amount,
    }));

    const lines: InvoiceLineProps[] = sourceLines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: Money.of(line.unitPriceMillimes),
      lineTotal: Money.of(line.unitPriceMillimes * line.quantity),
    }));

    const updated = Invoice.create({
      id: InvoiceId.from(input.invoiceId),
      companyId: CompanyId.from(input.companyId),
      customerId: PartyId.from(input.customerId ?? invoice.customerId.value),
      number: InvoiceNumber.from(input.number ?? invoice.number.value),
      issueDate: DateOnly.from(input.issueDate ?? invoice.issueDate.value),
      dueDate: DateOnly.from(input.dueDate ?? invoice.dueDate.value),
      lines,
    });
    await this.invoices.save(updated);
    return updated.snapshot();
  }
}
