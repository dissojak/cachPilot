import { CompanyId, UserId, InvoiceId } from "@cashpilot/domain";
import { PaymentRepository } from "../ports/payment-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ListPaymentsForInvoiceInput { userId: string; companyId: string; invoiceId: string; }

export class ListPaymentsForInvoice {
  constructor(private readonly payments: PaymentRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListPaymentsForInvoiceInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const items = await this.payments.byInvoice(InvoiceId.from(input.invoiceId));
    return items.filter((item) => item.companyId.value === input.companyId).map((item) => item.snapshot());
  }
}
