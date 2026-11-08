import { CompanyId, UserId, PartyId } from "@cashpilot/domain";
import { PartyRepository } from "../ports/party-repository";
import { InvoiceRepository } from "../ports/invoice-repository";
import { PaymentRepository } from "../ports/payment-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface GetPartyHistoryInput {
  userId: string;
  companyId: string;
  partyId: string;
}

export class GetPartyHistory {
  constructor(
    private readonly parties: PartyRepository,
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(input: GetPartyHistoryInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    const party = await this.parties.byId(PartyId.from(input.partyId));
    if (!party || !party.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.COMPANY_NOT_FOUND, "Party not found");
    }

    const invoices = await this.invoices.byCompany(CompanyId.from(input.companyId));
    const partyInvoices = invoices.filter((invoice) => invoice.customerId.equals(PartyId.from(input.partyId)));
    const payments = await this.payments.byCompany(CompanyId.from(input.companyId));

    return {
      party: party.snapshot(),
      invoices: partyInvoices.map((invoice) => invoice.snapshot()),
      payments: payments.filter((payment) => partyInvoices.some((invoice) => invoice.id.equals(payment.invoiceId))).map((payment) => payment.snapshot()),
    };
  }
}
