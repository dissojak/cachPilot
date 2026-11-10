import { authorize } from "../access/authorize";
import { CompanyId, PartyId, InvoiceId, DateOnly, Money } from "@cashpilot/domain";
import type { InvoiceLineInput } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface UpdateInvoiceDraftInput {
  userId: string;
  companyId: string;
  invoiceId: string;
  customerId?: string;
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
    await authorize(this.memberships, input, "invoices.manage");

    const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
    if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
    }

    const lines: InvoiceLineInput[] | undefined = input.lines?.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: Money.positive(line.unitPriceMillimes),
    }));

    invoice.reviseDraft({
      customerId: input.customerId ? PartyId.from(input.customerId) : undefined,
      issueDate: input.issueDate ? DateOnly.from(input.issueDate) : undefined,
      dueDate: input.dueDate ? DateOnly.from(input.dueDate) : undefined,
      lines,
    });
    await this.invoices.save(invoice);
    return invoice.snapshot();
  }
}
