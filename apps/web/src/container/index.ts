import { Company, User, Membership, Party, Invoice, InvoiceLineProps, Payment, Expense, CashMovement, Scenario, Money, DateOnly, CompanyId, UserId, PartyId, InvoiceId, PaymentId, ExpenseId, ScenarioId } from "@cashpilot/domain";
import {
  RegisterCompany,
  GetCompany,
  UpdateCompany,
  InviteMember,
  ChangeMemberRole,
  RemoveMember,
  CreateParty,
  UpdateParty,
  ListParties,
  GetPartyHistory,
  CreateInvoiceDraft,
  UpdateInvoiceDraft,
  ValidateInvoice,
  CancelInvoice,
  GetInvoice,
  ListInvoices,
  RecordPayment,
  ListPaymentsForInvoice,
  ExportInvoicePdf,
  SubmitExpense,
  AttachReceipt,
  UpdateSubmittedExpense,
  ListExpenses,
  GetExpense,
  ApproveExpense,
  RefuseExpense,
  MarkExpensePaid,
  SetOpeningBalance,
  RecordAdjustment,
  ListCashMovements,
  GetRealBalance,
  GetForecast,
  GetForecastSeries,
  ListAlerts,
  GetDashboard,
  CreateScenario,
  AddHypothesis,
  RunSimulation,
  CompareScenarios,
  ListScenarios,
  GetScenario,
  CreateRetainer,
  UpdateRetainer,
  PauseRetainer,
  ResumeRetainer,
  GenerateRetainerInvoices,
  ListRetainers,
} from "@cashpilot/application";
import {
  InMemoryCompanyRepository,
  InMemoryUserRepository,
  InMemoryMembershipRepository,
  InMemoryPartyRepository,
  InMemoryInvoiceRepository,
  InMemoryPaymentRepository,
  InMemoryExpenseRepository,
  InMemoryCashMovementRepository,
  InMemoryScenarioRepository,
  InMemoryRetainerRepository,
  InMemoryAuditLogRepository,
  MongoCompanyRepository,
  MongoUserRepository,
  MongoMembershipRepository,
  MongoPartyRepository,
  MongoInvoiceRepository,
  MongoPaymentRepository,
  MongoExpenseRepository,
  MongoCashMovementRepository,
  MongoScenarioRepository,
  MongoRetainerRepository,
  MongoAuditLogRepository,
  SystemClock,
  CryptoIdGenerator,
  InMemoryFileStorage,
  InMemoryPdfExporter,
  ConsoleLogger,
  NoopTransactionManager,
} from "@cashpilot/infra";
import { connectDb } from "@cashpilot/db";

type Repositories = {
  companies: CompanyRepository;
  users: UserRepository;
  memberships: MembershipRepository;
  parties: PartyRepository;
  invoices: InvoiceRepository;
  payments: PaymentRepository;
  expenses: ExpenseRepository;
  movements: CashMovementRepository;
  scenarios: ScenarioRepository;
  retainers: RetainerRepository;
  auditLogs: AuditLogRepository;
};
import type {
  CompanyRepository,
  UserRepository,
  MembershipRepository,
  PartyRepository,
  InvoiceRepository,
  PaymentRepository,
  ExpenseRepository,
  CashMovementRepository,
  ScenarioRepository,
  RetainerRepository,
  AuditLogRepository,
} from "@cashpilot/application";

function inMemoryRepositories(): Repositories {
  return {
    companies: new InMemoryCompanyRepository(),
    users: new InMemoryUserRepository(),
    memberships: new InMemoryMembershipRepository(),
    parties: new InMemoryPartyRepository(),
    invoices: new InMemoryInvoiceRepository(),
    payments: new InMemoryPaymentRepository(),
    expenses: new InMemoryExpenseRepository(),
    movements: new InMemoryCashMovementRepository(),
    scenarios: new InMemoryScenarioRepository(),
    retainers: new InMemoryRetainerRepository(),
    auditLogs: new InMemoryAuditLogRepository(),
  };
}

function mongoRepositories(): Repositories {
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
    auditLogs: new MongoAuditLogRepository(),
  };
}

const repositories: Repositories = process.env.DATABASE_URL
  ? mongoRepositories()
  : inMemoryRepositories();

export const companies = repositories.companies;
export const users = repositories.users;
export const memberships = repositories.memberships;
export const parties = repositories.parties;
export const invoices = repositories.invoices;
export const payments = repositories.payments;
export const expenses = repositories.expenses;
export const movements = repositories.movements;
export const scenarios = repositories.scenarios;
export const retainers = repositories.retainers;
export const auditLogs = repositories.auditLogs;

export const clock = new SystemClock();
export const idGenerator = new CryptoIdGenerator();
export const fileStorage = new InMemoryFileStorage();
export const pdfExporter = new InMemoryPdfExporter();
export const logger = new ConsoleLogger();
export const transactions = new NoopTransactionManager();

export const demo = {
  companyId: "company-atlas",
  ownerUserId: "user-owner",
  financeUserId: "user-finance",
  collaboratorUserId: "user-collab",
  acmePartyId: "party-acme",
  globexPartyId: "party-globex",
  supplierPartyId: "party-supplier",
};

const globalForSeed = globalThis as typeof globalThis & { cashpilotSeeded?: boolean };

export async function ensureDb() {
  if (process.env.DATABASE_URL) await connectDb();
  if (globalForSeed.cashpilotSeeded) return;
  globalForSeed.cashpilotSeeded = true;
  await seed();
}

async function seed() {
  const existingCompany = await companies.byId(CompanyId.from(demo.companyId));
  if (existingCompany) return;
  const companyId = CompanyId.from(demo.companyId);
  const ownerUserId = UserId.from(demo.ownerUserId);
  const financeUserId = UserId.from(demo.financeUserId);
  const collaboratorUserId = UserId.from(demo.collaboratorUserId);

  const company = Company.create({
    id: companyId,
    name: "Atlas Studio",
    sector: "digital agency",
    openingBalance: Money.of(5000000),
    forecastThreshold: Money.of(1000000),
  });
  await companies.save(company);

  await users.save(User.fromOAuth({ id: ownerUserId, email: "owner@cashpilot.demo", name: "Owner", provider: "demo", subject: "owner" }));
  await users.save(User.fromOAuth({ id: financeUserId, email: "finance@cashpilot.demo", name: "Finance Manager", provider: "demo", subject: "finance" }));
  await users.save(User.fromOAuth({ id: collaboratorUserId, email: "collab@cashpilot.demo", name: "Collaborator", provider: "demo", subject: "collab" }));

  await memberships.save(Membership.create(ownerUserId, companyId, "owner"));
  await memberships.save(Membership.create(financeUserId, companyId, "finance_manager"));
  await memberships.save(Membership.create(collaboratorUserId, companyId, "collaborator"));

  const acme = Party.create({ id: PartyId.from(demo.acmePartyId), companyId, type: "customer", name: "Acme Client" });
  const globex = Party.create({ id: PartyId.from(demo.globexPartyId), companyId, type: "customer", name: "Globex Corp" });
  const supplier = Party.create({ id: PartyId.from(demo.supplierPartyId), companyId, type: "supplier", name: "Office Supplies Co." });
  await parties.save(acme);
  await parties.save(globex);
  await parties.save(supplier);

  const invoiceLines: InvoiceLineProps[] = [{ description: "Design sprint", quantity: 1, unitPrice: Money.of(3000000), lineTotal: Money.of(3000000) }];
  const invoice1 = Invoice.create({ id: InvoiceId.from("invoice-001"), companyId, customerId: PartyId.from(demo.acmePartyId), number: (await import("@cashpilot/domain")).InvoiceNumber.from("INV-001"), issueDate: DateOnly.from("2026-11-01"), dueDate: DateOnly.from("2026-11-10"), lines: invoiceLines });
  invoice1.validate();
  invoice1.applyPayment(Money.of(1000000));
  await invoices.save(invoice1);
  await payments.save(Payment.create({ id: PaymentId.from("payment-001"), companyId, invoiceId: InvoiceId.from("invoice-001"), amount: Money.of(1000000), paymentDate: DateOnly.from("2026-11-05"), method: "bank_transfer", recordedBy: ownerUserId }));

  const invoice2Lines: InvoiceLineProps[] = [{ description: "Development retainer", quantity: 1, unitPrice: Money.of(4500000), lineTotal: Money.of(4500000) }];
  const invoice2 = Invoice.create({ id: InvoiceId.from("invoice-002"), companyId, customerId: PartyId.from(demo.globexPartyId), number: (await import("@cashpilot/domain")).InvoiceNumber.from("INV-002"), issueDate: DateOnly.from("2026-11-01"), dueDate: DateOnly.from("2026-11-25"), lines: invoice2Lines });
  invoice2.validate();
  await invoices.save(invoice2);

  const invoice3Lines: InvoiceLineProps[] = [{ description: "Consulting", quantity: 1, unitPrice: Money.of(1200000), lineTotal: Money.of(1200000) }];
  const invoice3 = Invoice.create({ id: InvoiceId.from("invoice-003"), companyId, customerId: PartyId.from(demo.acmePartyId), number: (await import("@cashpilot/domain")).InvoiceNumber.from("INV-003"), issueDate: DateOnly.from("2026-11-01"), dueDate: DateOnly.from("2026-11-30"), lines: invoice3Lines });
  await invoices.save(invoice3);

  const expense1 = Expense.create({ id: ExpenseId.from("expense-001"), companyId, submittedBy: ownerUserId, category: "Rent", description: "Office rent", amount: Money.of(2000000), expenseDate: DateOnly.from("2026-11-15") });
  expense1.approve(ownerUserId, DateOnly.from("2026-11-02"));
  expense1.markPaid(ownerUserId, DateOnly.from("2026-11-15"), Money.of(2000000));
  await expenses.save(expense1);

  const expense2 = Expense.create({ id: ExpenseId.from("expense-002"), companyId, submittedBy: collaboratorUserId, category: "Software", description: "Software subscription", amount: Money.of(400000), expenseDate: DateOnly.from("2026-11-20"), receiptFileId: "receipt-001" });
  await expenses.save(expense2);

  const expense3 = Expense.create({ id: ExpenseId.from("expense-003"), companyId, submittedBy: collaboratorUserId, category: "Meals", description: "Team lunch", amount: Money.of(120000), expenseDate: DateOnly.from("2026-11-12") });
  expense3.refuse(ownerUserId, DateOnly.from("2026-11-03"), "Not approved");
  await expenses.save(expense3);

  await movements.save(CashMovement.create({ companyId, type: "opening", amountMillimes: 5000000, movementDate: DateOnly.from("2026-11-01"), sourceType: "company", sourceId: companyId.value, actorId: ownerUserId, reason: "Opening balance" }));
  await movements.save(CashMovement.create({ companyId, type: "invoice_payment", amountMillimes: 1000000, movementDate: DateOnly.from("2026-11-05"), sourceType: "payment", sourceId: "payment-001", actorId: ownerUserId }));
  await movements.save(CashMovement.create({ companyId, type: "expense_payment", amountMillimes: -2000000, movementDate: DateOnly.from("2026-11-15"), sourceType: "expense", sourceId: "expense-001", actorId: ownerUserId }));

  const scenario = Scenario.create({ id: ScenarioId.from("scenario-001"), companyId, name: "Client pays 20 days late", baseReferenceDate: DateOnly.from("2026-11-01"), createdBy: ownerUserId });
  scenario.addHypothesis({ type: "client_delay", invoiceId: "invoice-002", delayDays: 20 });
  await scenarios.save(scenario);
}

export const useCases = {
  registerCompany: new RegisterCompany(companies, memberships),
  getCompany: new GetCompany(companies, memberships),
  updateCompany: new UpdateCompany(companies, memberships),
  inviteMember: new InviteMember(memberships, users),
  changeMemberRole: new ChangeMemberRole(memberships),
  removeMember: new RemoveMember(memberships),
  createParty: new CreateParty(parties, memberships),
  updateParty: new UpdateParty(parties, memberships),
  listParties: new ListParties(parties, memberships),
  getPartyHistory: new GetPartyHistory(parties, invoices, payments, memberships),
  createInvoiceDraft: new CreateInvoiceDraft(invoices, memberships),
  updateInvoiceDraft: new UpdateInvoiceDraft(invoices, memberships),
  validateInvoice: new ValidateInvoice(invoices, memberships),
  cancelInvoice: new CancelInvoice(invoices, payments, memberships),
  getInvoice: new GetInvoice(invoices, memberships),
  listInvoices: new ListInvoices(invoices, memberships),
  recordPayment: new RecordPayment(invoices, payments, movements, memberships, transactions),
  listPaymentsForInvoice: new ListPaymentsForInvoice(payments, memberships),
  exportInvoicePdf: new ExportInvoicePdf(invoices, memberships, pdfExporter),
  submitExpense: new SubmitExpense(expenses, memberships),
  attachReceipt: new AttachReceipt(expenses, memberships, fileStorage),
  updateSubmittedExpense: new UpdateSubmittedExpense(expenses, memberships),
  listExpenses: new ListExpenses(expenses, memberships),
  getExpense: new GetExpense(expenses, memberships),
  approveExpense: new ApproveExpense(expenses, memberships),
  refuseExpense: new RefuseExpense(expenses, memberships),
  markExpensePaid: new MarkExpensePaid(expenses, movements, memberships, transactions),
  setOpeningBalance: new SetOpeningBalance(companies, memberships),
  recordAdjustment: new RecordAdjustment(movements, memberships),
  listCashMovements: new ListCashMovements(movements, memberships),
  getRealBalance: new GetRealBalance(companies, movements, memberships),
  getForecast: new GetForecast(companies, invoices, expenses, movements, memberships, clock),
  getForecastSeries: new GetForecastSeries(companies, invoices, expenses, movements, memberships),
  listAlerts: new ListAlerts(invoices, expenses, memberships, clock, new GetForecast(companies, invoices, expenses, movements, memberships, clock)),
  getDashboard: new GetDashboard(companies, invoices, expenses, memberships, movements, clock, new GetForecast(companies, invoices, expenses, movements, memberships, clock), new ListAlerts(invoices, expenses, memberships, clock, new GetForecast(companies, invoices, expenses, movements, memberships, clock))),
  createScenario: new CreateScenario(scenarios, memberships),
  addHypothesis: new AddHypothesis(scenarios, memberships),
  runSimulation: new RunSimulation(scenarios, companies, invoices, expenses, movements, memberships),
  compareScenarios: new CompareScenarios(scenarios, companies, invoices, expenses, movements, memberships),
  listScenarios: new ListScenarios(scenarios, memberships),
  getScenario: new GetScenario(scenarios, memberships),
  createRetainer: new CreateRetainer(retainers, memberships),
  updateRetainer: new UpdateRetainer(retainers, memberships),
  pauseRetainer: new PauseRetainer(retainers, memberships),
  resumeRetainer: new ResumeRetainer(retainers, memberships),
  generateRetainerInvoices: new GenerateRetainerInvoices(retainers, invoices, memberships),
  listRetainers: new ListRetainers(retainers, memberships),
};
