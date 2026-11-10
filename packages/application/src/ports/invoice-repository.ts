import type { Invoice, InvoiceId, CompanyId } from "@cashpilot/domain";

export interface InvoiceRepository {
  byId(id: InvoiceId): Promise<Invoice | null>;
  byCompany(companyId: CompanyId): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<void>;
  /** Next number for the company (INV-0001, INV-0002…); atomic, never reused (D6). */
  nextNumber(companyId: CompanyId): Promise<string>;
}
