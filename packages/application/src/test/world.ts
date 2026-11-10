import { User, UserId, Membership, CompanyId, Party } from "@cashpilot/domain";
import type { MembershipRole } from "@cashpilot/domain";
import * as fakes from "./fakes";
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
} from "../index";

/** Wires every use case on in-memory fakes, exactly like the web composition root. */
export function createWorld(today = "2026-11-01") {
  const companies = new fakes.InMemoryCompanyRepository();
  const users = new fakes.InMemoryUserRepository();
  const memberships = new fakes.InMemoryMembershipRepository();
  const parties = new fakes.InMemoryPartyRepository();
  const invoices = new fakes.InMemoryInvoiceRepository();
  const payments = new fakes.InMemoryPaymentRepository();
  const expenses = new fakes.InMemoryExpenseRepository();
  const movements = new fakes.InMemoryCashMovementRepository();
  const scenarios = new fakes.InMemoryScenarioRepository();
  const retainers = new fakes.InMemoryRetainerRepository();
  const audit = new fakes.InMemoryAuditLogRepository();
  const ledger = new fakes.InMemoryFinancialLedger(invoices, payments, expenses, movements);
  const clock = new fakes.FixedClock(today);
  const ids = new fakes.SequentialIds();
  const pdf = new fakes.RecordingPdfExporter();
  const loader = new ForecastContextLoader(invoices, expenses, movements);
  const runSimulation = new RunSimulation(scenarios, loader, memberships);

  const useCases = {
    registerCompany: new RegisterCompany(companies, memberships, ledger, audit, ids, clock),
    getCompany: new GetCompany(companies, memberships),
    updateCompany: new UpdateCompany(companies, memberships, audit, clock),
    inviteMember: new InviteMember(memberships, users, audit, clock),
    changeMemberRole: new ChangeMemberRole(memberships, audit, clock),
    removeMember: new RemoveMember(memberships, audit, clock),
    listMembers: new ListMembers(memberships, users),
    createParty: new CreateParty(parties, memberships),
    updateParty: new UpdateParty(parties, memberships),
    listParties: new ListParties(parties, memberships),
    getPartyHistory: new GetPartyHistory(parties, invoices, payments, memberships),
    createInvoiceDraft: new CreateInvoiceDraft(invoices, parties, memberships),
    updateInvoiceDraft: new UpdateInvoiceDraft(invoices, memberships),
    validateInvoice: new ValidateInvoice(invoices, memberships, audit, clock),
    cancelInvoice: new CancelInvoice(invoices, payments, memberships, audit, clock),
    getInvoice: new GetInvoice(invoices, memberships, clock),
    listInvoices: new ListInvoices(invoices, memberships, clock),
    recordPayment: new RecordPayment(invoices, ledger, memberships, audit, ids, clock),
    listPaymentsForInvoice: new ListPaymentsForInvoice(payments, memberships),
    exportInvoicePdf: new ExportInvoicePdf(invoices, payments, parties, companies, memberships, pdf),
    submitExpense: new SubmitExpense(expenses, memberships),
    attachReceipt: new AttachReceipt(expenses, memberships, { save: async () => ({ id: "file-1", url: "memory://file-1" }), delete: async () => {} }),
    updateSubmittedExpense: new UpdateSubmittedExpense(expenses, memberships),
    listExpenses: new ListExpenses(expenses, memberships),
    getExpense: new GetExpense(expenses, memberships),
    approveExpense: new ApproveExpense(expenses, memberships, audit, clock),
    refuseExpense: new RefuseExpense(expenses, memberships, audit, clock),
    markExpensePaid: new MarkExpensePaid(expenses, ledger, memberships, audit, ids, clock),
    setOpeningBalance: new SetOpeningBalance(movements, ledger, memberships, audit, ids, clock),
    recordAdjustment: new RecordAdjustment(ledger, memberships, audit, ids, clock),
    listCashMovements: new ListCashMovements(movements, memberships),
    getRealBalance: new GetRealBalance(companies, movements, memberships, clock),
    getForecast: new GetForecast(loader, memberships, clock),
    listAlerts: new ListAlerts(loader, companies, memberships, clock),
    getDashboard: new GetDashboard(loader, companies, memberships, clock),
    createScenario: new CreateScenario(scenarios, memberships, clock),
    addHypothesis: new AddHypothesis(scenarios, memberships),
    removeHypothesis: new RemoveHypothesis(scenarios, memberships),
    runSimulation,
    compareScenarios: new CompareScenarios(runSimulation),
    listScenarios: new ListScenarios(scenarios, memberships),
    getScenario: new GetScenario(scenarios, memberships),
    createRetainer: new CreateRetainer(retainers, parties, memberships),
    updateRetainer: new UpdateRetainer(retainers, memberships),
    pauseRetainer: new PauseRetainer(retainers, memberships),
    resumeRetainer: new ResumeRetainer(retainers, memberships),
    generateRetainerInvoices: new GenerateRetainerInvoices(retainers, invoices, memberships, clock),
    listRetainers: new ListRetainers(retainers, memberships),
    resolveActor: new ResolveActor(users, memberships, ids),
    listMyCompanies: new ListMyCompanies(memberships, companies),
  };

  const repos = { companies, users, memberships, parties, invoices, payments, expenses, movements, scenarios, retainers, audit };
  return { useCases, repos, ledger, clock, ids, pdf };
}

export type World = ReturnType<typeof createWorld>;

/** A company with an owner, a finance manager, a collaborator and one customer. */
export async function createCompany(world: World, openingBalanceMillimes = 5_000_000) {
  const owner = await addUser(world, "owner");
  const { companyId } = await world.useCases.registerCompany.execute({
    userId: owner, name: "Atlas Studio", sector: "digital agency", openingBalanceMillimes, openingDate: world.clock.today().value,
  });
  const finance = await addUser(world, "finance", companyId, "finance_manager");
  const collaborator = await addUser(world, "collab", companyId, "collaborator");
  const customer = Party.create({ companyId: CompanyId.from(companyId), type: "customer", name: "Acme" });
  await world.repos.parties.save(customer);
  const as = (userId: string) => ({ userId, companyId });
  return { companyId, owner: as(owner), finance: as(finance), collaborator: as(collaborator), customerId: customer.id.value };
}

async function addUser(world: World, name: string, companyId?: string, role?: MembershipRole) {
  const user = User.fromOAuth({ id: UserId.from(world.ids.newId()), email: `${name}@demo.test`, name, provider: "demo", subject: name });
  await world.repos.users.save(user);
  if (companyId && role) await world.repos.memberships.save(Membership.create(user.id, CompanyId.from(companyId), role));
  return user.id.value;
}

/** A validated invoice of `amount` millimes due on `dueDate`. */
export async function validatedInvoice(world: World, company: Awaited<ReturnType<typeof createCompany>>, amount: number, dueDate: string) {
  const draft = await world.useCases.createInvoiceDraft.execute({
    ...company.finance, customerId: company.customerId, issueDate: world.clock.today().value, dueDate,
    lines: [{ description: "Work", quantity: 1, unitPriceMillimes: amount }],
  });
  await world.useCases.validateInvoice.execute({ ...company.finance, invoiceId: draft.id });
  return draft.id;
}
