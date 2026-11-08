import { Payment } from "@cashpilot/domain";
import { PaymentId } from "@cashpilot/domain";
import { InvoiceId } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface PaymentRepository {
  byId(id: PaymentId): Promise<Payment | null>;
  byInvoice(invoiceId: InvoiceId): Promise<Payment[]>;
  byCompany(companyId: CompanyId): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
}
