import { CompanyId, InvoiceId } from "@cashpilot/domain";
import type { PaymentRepository } from "../ports/payment-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import { authorize } from "../access/authorize";

export interface ListPaymentsForInvoiceInput { userId: string; companyId: string; invoiceId: string; }

export class ListPaymentsForInvoice {
  constructor(private readonly payments: PaymentRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListPaymentsForInvoiceInput) {
    await authorize(this.memberships, input, "invoices.view");
    const companyId = CompanyId.from(input.companyId);
    const items = await this.payments.byInvoice(InvoiceId.from(input.invoiceId));
    return items
      .filter((item) => item.companyId.equals(companyId))
      .map((item) => item.snapshot())
      .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  }
}
