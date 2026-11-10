import type { Payment, PaymentId, InvoiceId, CompanyId } from "@cashpilot/domain";

/** Read side only: payments are written through FinancialLedger. */
export interface PaymentRepository {
  byId(id: PaymentId): Promise<Payment | null>;
  byInvoice(invoiceId: InvoiceId): Promise<Payment[]>;
  byCompany(companyId: CompanyId): Promise<Payment[]>;
}
