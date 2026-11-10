import { CompanyId, Invoice, InvoiceNumber, DateOnly } from "@cashpilot/domain";
import type { RetainerRepository } from "../ports/retainer-repository";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export interface GenerateRetainerInvoicesInput { userId: string; companyId: string; asOfDate?: string; }

/**
 * Original feature: each due period of an active retainer becomes one
 * validated invoice (an expected receipt in the forecast). The retainer then
 * advances, so running this twice never creates duplicates.
 */
export class GenerateRetainerInvoices {
  constructor(
    private readonly retainers: RetainerRepository,
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GenerateRetainerInvoicesInput) {
    await authorize(this.memberships, input, "retainers.manage");
    const companyId = CompanyId.from(input.companyId);
    const asOf = input.asOfDate ? DateOnly.from(input.asOfDate) : this.clock.today();
    const generated: string[] = [];

    for (const retainer of await this.retainers.byCompany(companyId)) {
      for (const periodStart of retainer.dueDates(asOf)) {
        const invoice = Invoice.create({
          companyId,
          customerId: retainer.customerId,
          number: InvoiceNumber.from(await this.invoices.nextNumber(companyId)),
          issueDate: periodStart,
          dueDate: periodStart,
          lines: [{ description: retainer.name, quantity: 1, unitPrice: retainer.amount }],
        });
        invoice.validate();
        await this.invoices.save(invoice);
        retainer.advance();
        await this.retainers.save(retainer);
        generated.push(invoice.id.value);
      }
    }
    return { generatedInvoiceIds: generated };
  }
}
