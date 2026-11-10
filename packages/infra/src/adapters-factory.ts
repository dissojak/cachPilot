import {
  MongoCompanyRepository, MongoUserRepository, MongoMembershipRepository, MongoPartyRepository, MongoInvoiceRepository,
  MongoPaymentRepository, MongoExpenseRepository, MongoCashMovementRepository, MongoScenarioRepository,
  MongoRetainerRepository, MongoAuditLogRepository, MongoFinancialLedger,
} from "./mongo";
import { CloudinaryFileStorage, InMemoryFileStorage, PdfLibInvoiceExporter, SystemClock, CryptoIdGenerator, JsonLogger } from "./adapters";

/**
 * Every adapter the application needs, backed by MongoDB. The composition
 * root (apps/web/src/container) calls this once and wires the use cases.
 */
export function createMongoAdapters(options: { cloudinaryUrl?: string }) {
  return {
    companies: new MongoCompanyRepository(),
    users: new MongoUserRepository(),
    memberships: new MongoMembershipRepository(),
    parties: new MongoPartyRepository(),
    invoices: new MongoInvoiceRepository(),
    payments: new MongoPaymentRepository(),
    expenses: new MongoExpenseRepository(),
    movements: new MongoCashMovementRepository(),
    scenarios: new MongoScenarioRepository(),
    retainers: new MongoRetainerRepository(),
    audit: new MongoAuditLogRepository(),
    ledger: new MongoFinancialLedger(),
    // receipts need Cloudinary; without it they are kept in memory and lost on restart
    fileStorage: options.cloudinaryUrl ? new CloudinaryFileStorage(options.cloudinaryUrl) : new InMemoryFileStorage(),
    pdfExporter: new PdfLibInvoiceExporter(),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    logger: new JsonLogger(),
  };
}

export type Adapters = ReturnType<typeof createMongoAdapters>;
