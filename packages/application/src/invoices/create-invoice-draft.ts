import { CompanyId, PartyId, Invoice, InvoiceNumber, DateOnly, Money, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { InvoiceLineInput } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { PartyRepository } from "../ports/party-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface CreateInvoiceDraftInput {
  userId: string;
  companyId: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  lines: { description: string; quantity: number; unitPriceMillimes: number }[];
}

export class CreateInvoiceDraft {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly parties: PartyRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: CreateInvoiceDraftInput) {
    await authorize(this.memberships, input, "invoices.manage");
    const companyId = CompanyId.from(input.companyId);

    // BR-01/BR-32: the customer must be a customer of this same company.
    const customer = await this.parties.byId(PartyId.from(input.customerId));
    if (!customer || !customer.companyId.equals(companyId) || customer.type !== "customer") {
      throw new DomainError(DOMAIN_ERROR_CODES.PARTY_NOT_FOUND, "Customer not found");
    }

    const lines: InvoiceLineInput[] = input.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: Money.positive(line.unitPriceMillimes),
    }));

    const invoice = Invoice.create({
      companyId,
      customerId: customer.id,
      number: InvoiceNumber.from(await this.invoices.nextNumber(companyId)),
      issueDate: DateOnly.from(input.issueDate),
      dueDate: DateOnly.from(input.dueDate),
      lines,
    });
    await this.invoices.save(invoice);
    return invoice.snapshot();
  }
}
