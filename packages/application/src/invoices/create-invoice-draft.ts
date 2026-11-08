import { CompanyId, UserId, PartyId, Invoice, InvoiceNumber, DateOnly, Money, InvoiceLineProps } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface CreateInvoiceDraftInput {
  userId: string;
  companyId: string;
  customerId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  lines: { description: string; quantity: number; unitPriceMillimes: number }[];
}

export class CreateInvoiceDraft {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: CreateInvoiceDraftInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    const lines: InvoiceLineProps[] = input.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: Money.of(line.unitPriceMillimes),
      lineTotal: Money.of(line.unitPriceMillimes * line.quantity),
    }));

    const invoice = Invoice.create({
      companyId: CompanyId.from(input.companyId),
      customerId: PartyId.from(input.customerId),
      number: InvoiceNumber.from(input.number),
      issueDate: DateOnly.from(input.issueDate),
      dueDate: DateOnly.from(input.dueDate),
      lines,
    });
    await this.invoices.save(invoice);
    return invoice.snapshot();
  }
}
