import { CompanyId, UserId, RetainerId, Invoice, InvoiceNumber, DateOnly, Money } from "@cashpilot/domain";
import { RetainerRepository } from "../ports/retainer-repository";
import { InvoiceRepository } from "../ports/invoice-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface GenerateRetainerInvoicesInput { userId: string; companyId: string; asOfDate: string; }

export class GenerateRetainerInvoices {
  constructor(
    private readonly retainers: RetainerRepository,
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: GenerateRetainerInvoicesInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const asOf = DateOnly.from(input.asOfDate);
    const retainers = await this.retainers.byCompany(CompanyId.from(input.companyId));
    const generated: string[] = [];

    for (const retainer of retainers) {
      if (retainer.status !== "active") continue;
      while (!retainer.nextGenerationDate.isAfter(asOf)) {
        const number = await this.invoices.nextNumber(CompanyId.from(input.companyId));
        const invoice = Invoice.create({
          companyId: CompanyId.from(input.companyId),
          customerId: retainer.customerId,
          number: InvoiceNumber.from(number),
          issueDate: retainer.nextGenerationDate,
          dueDate: retainer.nextGenerationDate,
          lines: [{
            description: retainer.name,
            quantity: 1,
            unitPrice: retainer.amount,
            lineTotal: retainer.amount,
          }],
        });
        invoice.validate();
        await this.invoices.save(invoice);
        generated.push(invoice.id.value);
        retainer.advance();
        await this.retainers.save(retainer);
      }
    }

    return { generatedInvoiceIds: generated };
  }
}
