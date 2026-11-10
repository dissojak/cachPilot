import { authorize } from "../access/authorize";
import { CompanyId, PartyId } from "@cashpilot/domain";
import type { PartyRepository } from "../ports/party-repository";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { PaymentRepository } from "../ports/payment-repository";
import type { MembershipRepository } from "../ports/membership-repository";
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
    await authorize(this.memberships, input, "parties.view");

    const party = await this.parties.byId(PartyId.from(input.partyId));
    if (!party || !party.companyId.equals(CompanyId.from(input.companyId))) {
      throw new DomainError(DOMAIN_ERROR_CODES.PARTY_NOT_FOUND, "Party not found");
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
