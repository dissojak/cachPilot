
import {
  CompanyId,
  UserId,
  PartyId,
  InvoiceId,
  Invoice,
  InvoiceNumber,
  DateOnly,
  Money,
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import type {
  InvoiceLineProps,
} from "@cashpilot/domain";

import type {
  InvoiceRepository,
  MembershipRepository,
  PartyRepository,
  IdGenerator,
} from "../ports";

export interface CreateInvoiceDraftInput {
  userId: string;
  companyId: string;
  customerId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  lines: {
    description: string;
    quantity: number;
    unitPriceMillimes: number;
  }[];
}

export class CreateInvoiceDraft {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly memberships: MembershipRepository,
    private readonly parties?: PartyRepository,
    private readonly ids?: IdGenerator
  ) {}

  async execute(input: CreateInvoiceDraftInput) {
    const companyId = CompanyId.from(input.companyId);
    const userId = UserId.from(input.userId);

    // 1. Verify company membership
    const membership =
      await this.memberships.byUserAndCompany(
        userId,
        companyId
      );

    if (!membership) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "Access denied"
      );
    }

    // 2. Check financial permissions
    if (
      membership.role !== "owner" &&
      membership.role !== "finance_manager"
    ) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "Insufficient permissions"
      );
    }

    // 3. Verify customer belongs to company
    if (this.parties) {
      const customer = await this.parties.byId(
        PartyId.from(input.customerId)
      );

      if (
        !customer ||
        customer.companyId.value !== input.companyId ||
        customer.type !== "customer"
      ) {
        throw new Error(
          "Customer not found in this company"
        );
      }
    }

    // 4. Validate invoice dates
    const issueDate = DateOnly.from(input.issueDate);
    const dueDate = DateOnly.from(input.dueDate);

    if (dueDate.isBefore(issueDate)) {
      throw new Error(
        "Due date cannot be before issue date"
      );
    }

    // 5. Validate invoice lines
    if (input.lines.length === 0) {
      throw new Error(
        "Invoice must contain at least one line"
      );
    }

    const lines: InvoiceLineProps[] =
      input.lines.map((line) => {
        if (
          !line.description.trim() ||
          !Number.isSafeInteger(line.quantity) ||
          line.quantity <= 0 ||
          !Number.isSafeInteger(line.unitPriceMillimes) ||
          line.unitPriceMillimes <= 0
        ) {
          throw new Error("Invalid invoice line");
        }

        const lineTotal =
          line.quantity * line.unitPriceMillimes;

        if (!Number.isSafeInteger(lineTotal)) {
          throw new Error("Invoice amount is too large");
        }

        return {
          description: line.description.trim(),
          quantity: line.quantity,
          unitPrice: Money.of(line.unitPriceMillimes),
          lineTotal: Money.of(lineTotal),
        };
      });

    const total = lines.reduce(
      (sum, line) => sum + line.lineTotal.amount,
      0
    );

    if (!Number.isSafeInteger(total)) {
      throw new Error("Invoice total is too large");
    }

    // 6. Create invoice
    const invoice = Invoice.create({
      id: this.ids
        ? InvoiceId.from(this.ids.newId())
        : undefined,
      companyId,
      customerId: PartyId.from(input.customerId),
      number: InvoiceNumber.from(input.number),
      issueDate,
      dueDate,
      lines,
    });

    // 7. Save to repository
    await this.invoices.save(invoice);

    return invoice.snapshot();
  }
}
