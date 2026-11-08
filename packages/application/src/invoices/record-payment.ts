import { CompanyId, UserId, InvoiceId, Payment, Money, DateOnly, CashMovement } from "@cashpilot/domain";
import { InvoiceRepository } from "../ports/invoice-repository";
import { PaymentRepository } from "../ports/payment-repository";
import { CashMovementRepository } from "../ports/cash-movement-repository";
import { MembershipRepository } from "../ports/membership-repository";
import { TransactionManager } from "../ports/transaction-manager";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface RecordPaymentInput {
  userId: string;
  companyId: string;
  invoiceId: string;
  amountMillimes: number;
  paymentDate: string;
  method: string;
  note?: string;
}

export class RecordPayment {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
    private readonly movements: CashMovementRepository,
    private readonly memberships: MembershipRepository,
    private readonly transactions: TransactionManager,
  ) {}

  async execute(input: RecordPaymentInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");

    return this.transactions.run(async () => {
      const invoice = await this.invoices.byId(InvoiceId.from(input.invoiceId));
      if (!invoice || !invoice.companyId.equals(CompanyId.from(input.companyId))) {
        throw new DomainError(DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND, "Invoice not found");
      }
      const amount = Money.of(input.amountMillimes);
      invoice.applyPayment(amount);

      const payment = Payment.create({
        companyId: CompanyId.from(input.companyId),
        invoiceId: InvoiceId.from(input.invoiceId),
        amount,
        paymentDate: DateOnly.from(input.paymentDate),
        method: input.method,
        note: input.note,
        recordedBy: UserId.from(input.userId),
      });
      await this.payments.save(payment);
      await this.invoices.save(invoice);

      const movement = CashMovement.create({
        companyId: CompanyId.from(input.companyId),
        type: "invoice_payment",
        amountMillimes: amount.amount,
        movementDate: DateOnly.from(input.paymentDate),
        sourceType: "payment",
        sourceId: payment.id.value,
        actorId: UserId.from(input.userId),
      });
      await this.movements.save(movement);

      return { payment: payment.snapshot(), invoice: invoice.snapshot() };
    });
  }
}
