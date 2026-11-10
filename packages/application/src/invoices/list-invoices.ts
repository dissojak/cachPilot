import { CompanyId } from "@cashpilot/domain";
import type { InvoiceStatus } from "@cashpilot/domain";
import type { InvoiceRepository } from "../ports/invoice-repository";
import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";

export type InvoiceFilter = InvoiceStatus | "overdue";

export interface ListInvoicesInput { userId: string; companyId: string; filter?: InvoiceFilter; customerId?: string; }

export class ListInvoices {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListInvoicesInput) {
    await authorize(this.memberships, input, "invoices.view");
    const today = this.clock.today();
    const items = await this.invoices.byCompany(CompanyId.from(input.companyId));
    return items
      .filter((invoice) => !input.customerId || invoice.customerId.value === input.customerId)
      .filter((invoice) => {
        if (!input.filter) return true;
        // BR-05: "overdue" is derived by the entity, never re-implemented in a page.
        if (input.filter === "overdue") return invoice.isOverdue(today);
        return invoice.status === input.filter;
      })
      .sort((a, b) => b.issueDate.value.localeCompare(a.issueDate.value))
      .map((invoice) => ({ ...invoice.snapshot(), overdue: invoice.isOverdue(today) }));
  }
}
