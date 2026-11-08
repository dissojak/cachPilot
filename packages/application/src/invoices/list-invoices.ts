import { CompanyId, UserId } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface ListInvoicesInput { userId: string; companyId: string; status?: string; }

export class ListInvoices {
  constructor(private readonly invoices: InvoiceRepository, private readonly memberships: MembershipRepository) {}
  async execute(input: ListInvoicesInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const items = await this.invoices.byCompany(CompanyId.from(input.companyId));
    return input.status ? items.filter((item) => item.status === input.status).map((item) => item.snapshot()) : items.map((item) => item.snapshot());
  }
}
