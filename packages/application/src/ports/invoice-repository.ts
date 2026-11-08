import { Invoice } from "@cashpilot/domain";
import { InvoiceId } from "@cashpilot/domain";
import { CompanyId } from "@cashpilot/domain";

export interface InvoiceRepository {
  byId(id: InvoiceId): Promise<Invoice | null>;
  byCompany(companyId: CompanyId): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<void>;
  nextNumber(companyId: CompanyId): Promise<string>;
}
