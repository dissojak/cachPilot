import {
  RegisterCompany, GetCompany, UpdateCompany, InviteMember, ChangeMemberRole, RemoveMember, ListMembers,
  CreateParty, UpdateParty, ListParties, GetPartyHistory,
  CreateInvoiceDraft, UpdateInvoiceDraft, ValidateInvoice, CancelInvoice, GetInvoice, ListInvoices,
  RecordPayment, ListPaymentsForInvoice, ExportInvoicePdf,
  SubmitExpense, AttachReceipt, UpdateSubmittedExpense, ListExpenses, GetExpense, ApproveExpense, RefuseExpense, MarkExpensePaid,
  SetOpeningBalance, RecordAdjustment, ListCashMovements, GetRealBalance,
  ForecastContextLoader, GetForecast, ListAlerts, GetDashboard,
  CreateScenario, AddHypothesis, RemoveHypothesis, RunSimulation, CompareScenarios, ListScenarios, GetScenario,
  CreateRetainer, UpdateRetainer, PauseRetainer, ResumeRetainer, GenerateRetainerInvoices, ListRetainers,
  ResolveActor, ListMyCompanies,
} from "@cashpilot/application";
import { createMongoAdapters } from "@cashpilot/infra";
import { getServerEnv } from "@cashpilot/config";

/**
 * Composition root (course s.28): the only file that knows which adapter
 * implements which port. Everything reads and writes MongoDB — there is no
 * seed and no in-memory fallback in the running app.
 */
// connectDb() fails with a clear message on first use if DATABASE_URL is missing,
// so `next build` still works without a database.
const env = getServerEnv();
const a = createMongoAdapters({ cloudinaryUrl: env.CLOUDINARY_URL });
const loader = new ForecastContextLoader(a.invoices, a.expenses, a.movements);
const runSimulation = new RunSimulation(a.scenarios, loader, a.memberships);

export const useCases = {
  resolveActor: new ResolveActor(a.users, a.memberships, a.ids),
  listMyCompanies: new ListMyCompanies(a.memberships, a.companies),

  registerCompany: new RegisterCompany(a.companies, a.memberships, a.ledger, a.audit, a.ids, a.clock),
  getCompany: new GetCompany(a.companies, a.memberships),
  updateCompany: new UpdateCompany(a.companies, a.memberships, a.audit, a.clock),
  inviteMember: new InviteMember(a.memberships, a.users, a.audit, a.clock),
  changeMemberRole: new ChangeMemberRole(a.memberships, a.audit, a.clock),
  removeMember: new RemoveMember(a.memberships, a.audit, a.clock),
  listMembers: new ListMembers(a.memberships, a.users),

  createParty: new CreateParty(a.parties, a.memberships),
  updateParty: new UpdateParty(a.parties, a.memberships),
  listParties: new ListParties(a.parties, a.memberships),
  getPartyHistory: new GetPartyHistory(a.parties, a.invoices, a.payments, a.memberships),

  createInvoiceDraft: new CreateInvoiceDraft(a.invoices, a.parties, a.memberships),
  updateInvoiceDraft: new UpdateInvoiceDraft(a.invoices, a.memberships),
  validateInvoice: new ValidateInvoice(a.invoices, a.memberships, a.audit, a.clock),
  cancelInvoice: new CancelInvoice(a.invoices, a.payments, a.memberships, a.audit, a.clock),
  getInvoice: new GetInvoice(a.invoices, a.memberships, a.clock),
  listInvoices: new ListInvoices(a.invoices, a.memberships, a.clock),
  recordPayment: new RecordPayment(a.invoices, a.ledger, a.memberships, a.audit, a.ids, a.clock),
  listPaymentsForInvoice: new ListPaymentsForInvoice(a.payments, a.memberships),
  exportInvoicePdf: new ExportInvoicePdf(a.invoices, a.payments, a.parties, a.companies, a.memberships, a.pdfExporter),

  submitExpense: new SubmitExpense(a.expenses, a.memberships),
  attachReceipt: new AttachReceipt(a.expenses, a.memberships, a.fileStorage),
  updateSubmittedExpense: new UpdateSubmittedExpense(a.expenses, a.memberships),
  listExpenses: new ListExpenses(a.expenses, a.memberships),
  getExpense: new GetExpense(a.expenses, a.memberships),
  approveExpense: new ApproveExpense(a.expenses, a.memberships, a.audit, a.clock),
  refuseExpense: new RefuseExpense(a.expenses, a.memberships, a.audit, a.clock),
  markExpensePaid: new MarkExpensePaid(a.expenses, a.ledger, a.memberships, a.audit, a.ids, a.clock),

  setOpeningBalance: new SetOpeningBalance(a.movements, a.ledger, a.memberships, a.audit, a.ids, a.clock),
  recordAdjustment: new RecordAdjustment(a.ledger, a.memberships, a.audit, a.ids, a.clock),
  listCashMovements: new ListCashMovements(a.movements, a.memberships),
  getRealBalance: new GetRealBalance(a.companies, a.movements, a.memberships, a.clock),

  getForecast: new GetForecast(loader, a.memberships, a.clock),
  listAlerts: new ListAlerts(loader, a.companies, a.memberships, a.clock),
  getDashboard: new GetDashboard(loader, a.companies, a.memberships, a.clock),

  createScenario: new CreateScenario(a.scenarios, a.memberships, a.clock),
  addHypothesis: new AddHypothesis(a.scenarios, a.memberships),
  removeHypothesis: new RemoveHypothesis(a.scenarios, a.memberships),
  runSimulation,
  compareScenarios: new CompareScenarios(runSimulation),
  listScenarios: new ListScenarios(a.scenarios, a.memberships),
  getScenario: new GetScenario(a.scenarios, a.memberships),

  createRetainer: new CreateRetainer(a.retainers, a.parties, a.memberships),
  updateRetainer: new UpdateRetainer(a.retainers, a.memberships),
  pauseRetainer: new PauseRetainer(a.retainers, a.memberships),
  resumeRetainer: new ResumeRetainer(a.retainers, a.memberships),
  generateRetainerInvoices: new GenerateRetainerInvoices(a.retainers, a.invoices, a.memberships, a.clock),
  listRetainers: new ListRetainers(a.retainers, a.memberships),
};

export const logger = a.logger;
