import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDb, mongoose } from "@cashpilot/db";
import { Company, CompanyId, Invoice, InvoiceNumber, PartyId, DateOnly, Money, Payment, PaymentId, UserId, CashMovement, CashMovementId, DomainError, Expense } from "@cashpilot/domain";
import { MongoCompanyRepository, MongoInvoiceRepository, MongoPaymentRepository, MongoCashMovementRepository, MongoExpenseRepository } from "./repositories";
import { MongoFinancialLedger } from "./financial-ledger";

/**
 * Course s.51: a few tests per adapter against a real, disposable database.
 * A replica set is required for transactions (Atlas is one too).
 */
let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.DATABASE_URL = replSet.getUri("cashpilot-test");
  await connectDb();
  await Promise.all(Object.values(mongoose.models).map((model) => model.createCollection().then(() => model.syncIndexes())));
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

const companyId = CompanyId.from("company-a");
const user = UserId.from("user-a");

async function storedInvoice(id: string, amount = 3_000_000) {
  const invoice = Invoice.create({
    id: (await import("@cashpilot/domain")).InvoiceId.from(id), companyId, customerId: PartyId.from("party-a"),
    number: InvoiceNumber.from(`INV-${id}`), issueDate: DateOnly.from("2026-11-01"), dueDate: DateOnly.from("2026-11-10"),
    lines: [{ description: "Work", quantity: 1, unitPrice: Money.positive(amount) }],
  });
  invoice.validate();
  await new MongoInvoiceRepository().save(invoice);
  return invoice;
}

function paymentFor(invoice: Invoice, id: string, amount: number) {
  const payment = Payment.create({ id: PaymentId.from(id), companyId, invoiceId: invoice.id, amount: Money.positive(amount), paymentDate: DateOnly.from("2026-11-05"), method: "cash", recordedBy: user });
  return { payment, movement: CashMovement.fromInvoicePayment({ id: CashMovementId.from(`mv-${id}`), payment }) };
}

describe("mongo adapters", () => {
  it("round-trips a company and an invoice through the mappers", async () => {
    await new MongoCompanyRepository().save(Company.create({ id: companyId, name: "Atlas", sector: "agency", forecastThreshold: Money.of(1_000) }));
    const company = await new MongoCompanyRepository().byId(companyId);
    expect(company?.snapshot()).toEqual({ id: "company-a", name: "Atlas", sector: "agency", forecastThresholdMillimes: 1_000 });
    const invoice = await storedInvoice("rt");
    expect((await new MongoInvoiceRepository().byId(invoice.id))?.snapshot()).toEqual(invoice.snapshot());
  });

  it("records a payment, the invoice and one cash movement in one transaction, with companyId", async () => {
    const invoice = await storedInvoice("p1");
    const previous = invoice.remaining;
    invoice.applyPayment(Money.positive(1_000_000));
    const { payment, movement } = paymentFor(invoice, "pay-1", 1_000_000);
    await new MongoFinancialLedger().recordInvoicePayment({ invoice, expectedPreviousRemaining: previous, payment, movement });

    expect((await new MongoInvoiceRepository().byId(invoice.id))?.remaining.amount).toBe(2_000_000);
    expect(await new MongoPaymentRepository().byInvoice(invoice.id)).toHaveLength(1);
    const movements = await new MongoCashMovementRepository().byCompany(companyId);
    expect(movements.find((item) => item.id.value === "mv-pay-1")?.amount.amount).toBe(1_000_000);
  });

  it("rejects the same payment twice and writes nothing the second time", async () => {
    const invoice = await storedInvoice("p2");
    const first = invoice.remaining;
    invoice.applyPayment(Money.positive(500_000));
    const { payment, movement } = paymentFor(invoice, "pay-2", 500_000);
    await new MongoFinancialLedger().recordInvoicePayment({ invoice, expectedPreviousRemaining: first, payment, movement });

    const again = (await new MongoInvoiceRepository().byId(invoice.id))!;
    const second = again.remaining;
    again.applyPayment(Money.positive(500_000));
    const duplicate = paymentFor(again, "pay-2", 500_000);
    await expect(new MongoFinancialLedger().recordInvoicePayment({
      invoice: again, expectedPreviousRemaining: second, payment: duplicate.payment, movement: CashMovement.fromInvoicePayment({ id: CashMovementId.from("mv-other"), payment: duplicate.payment }),
    })).rejects.toMatchObject({ code: "DUPLICATE_OPERATION" });
    // the transaction rolled back the invoice update
    expect((await new MongoInvoiceRepository().byId(invoice.id))?.remaining.amount).toBe(2_500_000);
  });

  it("rejects a payment computed from a stale invoice (two users at once)", async () => {
    const invoice = await storedInvoice("p3");
    const stale = invoice.remaining;
    const a = (await new MongoInvoiceRepository().byId(invoice.id))!;
    a.applyPayment(Money.positive(2_000_000));
    await new MongoFinancialLedger().recordInvoicePayment({ invoice: a, expectedPreviousRemaining: stale, ...paymentFor(a, "pay-3a", 2_000_000) });

    const b = invoice; // still thinks 3 000 DT remain
    b.applyPayment(Money.positive(2_000_000));
    const error = await new MongoFinancialLedger().recordInvoicePayment({ invoice: b, expectedPreviousRemaining: stale, ...paymentFor(b, "pay-3b", 2_000_000) }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe("CONCURRENT_UPDATE");
    expect(await new MongoPaymentRepository().byInvoice(invoice.id)).toHaveLength(1); // no overpayment
  });

  it("gives unique invoice numbers under concurrency", async () => {
    const repo = new MongoInvoiceRepository();
    const numbers = await Promise.all(Array.from({ length: 10 }, () => repo.nextNumber(CompanyId.from("company-b"))));
    expect(new Set(numbers).size).toBe(10);
  });

  it("never returns another company's data", async () => {
    expect(await new MongoInvoiceRepository().byCompany(CompanyId.from("company-zzz"))).toEqual([]);
    expect(await new MongoCashMovementRepository().byCompany(CompanyId.from("company-zzz"))).toEqual([]);
  });
});

describe("mongo adapters: reversal and receipt link", () => {
  it("finds a movement by id, and stores a reversal linked to its original", async () => {
    const date = DateOnly.from("2026-11-05");
    const original = CashMovement.adjustment({ id: CashMovementId.from("mv-adj-1"), companyId, actorId: user, date, amount: Money.of(-250_000), reason: "Bank fee" });
    const ledger = new MongoFinancialLedger();
    await ledger.recordMovement(original);

    const movements = new MongoCashMovementRepository();
    const loaded = await movements.byId(original.id);
    expect(loaded?.snapshot()).toEqual(original.snapshot());
    expect(await movements.byId(CashMovementId.from("does-not-exist"))).toBeNull();

    const reversal = CashMovement.reversal({ id: CashMovementId.from("reversal-mv-adj-1"), original, actorId: user, date, reason: "Entered twice" });
    await ledger.recordMovement(reversal);
    await expect(ledger.recordMovement(reversal)).rejects.toMatchObject({ code: "DUPLICATE_OPERATION" });
    const stored = await movements.byId(reversal.id);
    expect(stored?.reversesId?.value).toBe("mv-adj-1");
    expect(stored?.amount.amount).toBe(250_000);
  });

  it("round-trips the receipt link of an expense", async () => {
    const expense = Expense.create({
      companyId, submittedBy: user, category: "Software", description: "Subscription",
      amount: Money.positive(400_000), expenseDate: DateOnly.from("2026-11-20"),
    });
    expense.attachReceipt("receipt-1", "https://files.example/receipt-1.png");
    const expenses = new MongoExpenseRepository();
    await expenses.save(expense);
    expect((await expenses.byId(expense.id))?.snapshot()).toMatchObject({ receiptFileId: "receipt-1", receiptUrl: "https://files.example/receipt-1.png" });

    expense.attachReceipt("receipt-2");
    await expenses.save(expense);
    expect((await expenses.byId(expense.id))?.receiptUrl).toBeUndefined();
  });
});
