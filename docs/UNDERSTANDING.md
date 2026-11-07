# CashPilot — Understanding (Phase 1)

## 0. Decisions taken (Phase 1)

- Authentication: OAuth via a free provider/library (Auth.js/NextAuth recommended), not a custom auth system. No long-lived tokens; short-lived sessions with rotation/revocation.
- UI language: English.
- Currency: DNT, stored as integer millimes; display in English format (e.g. `2,000.000 DNT`).
- Database: MongoDB Atlas (free M0 for dev/demo), accessed through a clean adapter in `packages/db`/`packages/infra`.
- Deployment: Vercel only, no Docker.
- Git workflow: default feature branches + pull requests.
- PDF export: easiest option (server-side PDF library behind `PdfExporter`, with printable HTML fallback if faster).
- State management: Redux Toolkit only for client UI state; server data stays in Server Components/Server Actions.
- Logging: structured logs for everything, plus an audit log for financial/security events.
- Security: server-side authorization, short-lived sessions, secure cookies, input validation, least-privilege DB access, rate limiting.

These decisions override the course's default PostgreSQL/Prisma choice while keeping the same layering.

This is the team's single reference of understanding. It is written from `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md` and `.opencode/skills/clean-nextjs-monorepo/SKILL.md`. It contains no code and no scaffolding. Decisions that only the team can make are listed in section 15 and asked again at the end of Phase 1.

---

## 1. Problem and objectives

Small businesses can be profitable on paper and still run out of cash, because **sales are not cash**: an invoice issued today may be paid weeks later, while salaries, rent and suppliers are due now. Tracking this in scattered spreadsheets means the shortage is noticed when the bank account is already empty.

CashPilot is a web application for a small business that:

1. tracks **real cash** (what is actually in the bank),
2. **forecasts** cash at 30, 60 and 90 days from unpaid invoices and planned expenses,
3. **simulates** decisions ("what if a client pays 20 days late?") without touching real data,
4. **controls spending** through submit → approve/refuse → pay.

Non-goals: no bank integration; operations are recorded or simulated only. Multi-company (each company is a tenant). Built as a pnpm + Turborepo monorepo with Next.js App Router and Clean Architecture.

## 2. Glossary

| French | English | Definition |
|---|---|---|
| Entreprise | Company / tenant | The business whose cash is tracked; the isolation boundary for all data. |
| Dirigeant | Owner / manager | Approves expenses and consults indicators. |
| Gestionnaire financier | Finance manager | Manages invoices, payments and forecasts. |
| Collaborateur | Employee / contributor | Submits expenses and consults own requests. |
| Client | Customer | Party that owes money to the company. |
| Fournisseur | Supplier / vendor | Party the company owes money to. |
| Facture | Invoice | Billing document with an amount and a due date. |
| Brouillon | Draft | Invoice not yet validated; not yet part of the forecast. |
| Validation (facture) | Issue / validate | Makes an invoice official: it now counts as an expected receipt. |
| Annulation | Cancellation | Marks an invoice as cancelled; it no longer counts. |
| Encaissement | Cash receipt / payment received | Money actually received from a customer. |
| Décaissement | Cash disbursement / payment out | Money actually paid out. |
| Échéance | Due date | Date by which an invoice is expected to be paid. |
| Solde réel | Real balance | Actual cash: opening balance plus realized movements. |
| Solde prévisionnel | Forecast balance | Projected cash at a given future date. |
| Reste à payer | Remaining amount | Unpaid portion of an invoice. |
| Paiement partiel | Partial payment | Payment smaller than the remaining amount; reduces it. |
| Dépense | Expense | Planned or realized cash outflow, with category, amount, date, receipt. |
| Justificatif | Receipt / attachment | File attached to an expense. |
| Statut | Status | Lifecycle state of an invoice or expense. |
| Alerte | Alert | Signal: overdue invoice, expense to approve, negative forecast. |
| Scénario | Scenario | A separate set of assumptions used for simulation. |
| Hypothèse | Assumption / hypothesis | One change applied in a scenario (delay, new expense, extra income). |
| Mouvement de trésorerie | Cash movement | One realized cash effect recorded in the ledger. |
| Solde initial | Opening balance | Real balance at the start of tracking. |
| Trésorerie | Cash / treasury | The money actually available. |
| Millime | 1/1000 DT | Smallest currency unit; money is stored as integer millimes. |
| Contrepartie | Reversal / adjustment | A traceable operation that corrects a previous one. |
| Reste à payer (facture) | Invoice remaining | Total minus payments received. |

## 3. Roles and DRAFT permissions matrix (to validate)

The spec leaves detailed rights to the framing milestone. This matrix is a proposal; mark it "to validate" with the team before coding. Columns: **D** = Dirigeant (owner), **G** = Gestionnaire financier (finance manager), **C** = Collaborateur (employee).

| Action | D | G | C | Notes |
|---|---|---|---|---|
| View company dashboard and alerts | Y | Y | N | Collaborator may see own expense status only. |
| View real balance and cash movements | Y | Y | N | |
| Set / adjust opening balance | Y | Y | N | Creates a cash movement. |
| Record a correction / reversal | Y | Y | N | Reason required; original kept. |
| Manage company profile and members | Y | N | N | Owner only. |
| Create / edit customers and suppliers | Y (read) | Y | N | |
| Create invoice draft | N | Y | N | |
| Validate / issue invoice | N | Y | N | Becomes an expected receipt. |
| Cancel invoice | N | Y | N | Only if no payment received; otherwise reversal. |
| Export invoice PDF | Y | Y | N | |
| Record total or partial payment | N | Y | N | Updates real balance and remaining. |
| View all invoices and payments | Y | Y | N | |
| Submit an expense | Y | Y | Y | Anyone may submit for their company. |
| Attach a receipt to own expense | Y | Y | Y | |
| Edit own submitted expense (before decision) | N | Y | Y | Submitter can fix; manager can fix. |
| Approve or refuse an expense | Y | N | N | Per spec, owner approves. To validate. |
| Mark an approved expense as paid | N | Y | N | Creates cash movement. |
| View all expenses | Y | Y | N | Collaborator sees own only. |
| View own expense requests | Y | Y | Y | |
| View forecast (30/60/90) | Y | Y | N | |
| Run a simulation | Y | Y | N | |
| Save / compare scenarios | Y | Y | N | |
| Manage alerts configuration | Y | N | N | |

Assumptions to validate: whether the finance manager may also approve expenses in small teams; whether the owner may submit expenses; whether collaborators may see a simplified dashboard.

## 4. Business rules

Each rule is testable. Tagged with module (M1..M10 or X = cross-cutting) and the layer that owns it: **D** = domain, **A** = application, **I** = infrastructure, **P** = presentation.

- **BR-01 (X, A+I):** Every read and write is scoped by `companyId`. A user acting for company X can never read or modify data of company Y; the repository must filter by company and the use case must receive the acting user's membership.
- **BR-02 (M1, A):** Authorization is checked inside every mutating use case using the acting user (id + role + membership), not only in middleware. A forbidden call returns a typed `AccessDenied` error and changes no state.
- **BR-03 (M1, D):** A user may belong to one or more companies; an active company is selected server-side and included in every use-case input.
- **BR-04 (M3, D):** Invoice lifecycle states are `Draft`, `Validated`, `PartiallyPaid`, `Paid`, `Cancelled`. Allowed transitions: `Draft→Validated`, `Draft→Cancelled`, `Validated→PartiallyPaid`, `Validated→Paid`, `PartiallyPaid→Paid`. All other transitions throw `InvalidTransition`.
- **BR-05 (M3, D):** `Overdue` is a derived status: an invoice is overdue when it is `Validated` or `PartiallyPaid`, its due date is before the reference date, and its remaining amount is greater than zero.
- **BR-06 (M3, D):** A `Validated` or `PartiallyPaid` invoice may be cancelled only if no payment has been recorded. If payments exist, cancellation is blocked (`InvoiceHasPayments`); a correction must be a reversal/credit note.
- **BR-07 (M3, D):** An invoice total and every payment amount are strictly positive `Money` values. A zero or negative amount is rejected (`InvalidMoneyAmount`).
- **BR-08 (M3, D):** Invoice numbers are unique within a company. (Assumption to validate.)
- **BR-09 (M4, D):** A payment amount must be greater than zero and less than or equal to the invoice's remaining amount. A payment above the remaining amount is rejected (`PaymentExceedsRemaining`).
- **BR-10 (M4, D+A):** Recording a payment reduces the invoice's remaining amount by exactly the payment amount and creates exactly one cash movement. The same payment submitted twice is rejected (`DuplicateOperation`).
- **BR-11 (M4, D):** A fully paid invoice has remaining amount zero and status `Paid`; no further payment can be recorded (`InvoiceAlreadyPaid`).
- **BR-12 (M4, D):** Payments can only be recorded against `Validated` or `PartiallyPaid` invoices. Draft, cancelled and paid invoices are not payable.
- **BR-13 (M5/M6, D):** Expense lifecycle states are `Submitted`, `Approved`, `Refused`, `Paid`. Allowed transitions: `Submitted→Approved`, `Submitted→Refused`, `Approved→Paid`. All others throw `InvalidTransition`.
- **BR-14 (M6, D):** A `Refused` expense can never be marked `Paid` (`RefusedExpenseCannotBePaid`).
- **BR-15 (M6, D):** Only an `Approved` expense can be marked `Paid`, and it can be paid only once (`ExpenseAlreadyPaid`).
- **BR-16 (M6, D+A):** Marking an expense as paid creates exactly one cash movement for its amount. A refused or unapproved expense creates no cash movement.
- **BR-17 (M7, D+A):** The real balance equals the opening balance plus the sum of all cash movements for the company. A realized operation affects the real balance exactly once.
- **BR-18 (M7, A):** Multi-step writes that must be atomic (payment + cash movement, expense payment + cash movement, adjustment + movement) are wrapped in a transaction inside the adapter behind a port method; use cases never manage transactions.
- **BR-19 (M7, D):** Corrections never delete or edit a validated operation. They create a new traceable operation (reversal or adjustment) linked to the original, with reason, actor and timestamp.
- **BR-20 (M8, D+A):** Forecast at a date = reference real balance + expected receipts with due date on or before that date − planned disbursements with planned date on or before that date.
- **BR-21 (M8, D):** Expected receipts use the **remaining amount** of each non-cancelled validated/partially paid invoice, anchored to the invoice's due date. Received money is never counted again.
- **BR-22 (M8, D):** Planned disbursements use approved (and, if the team decides, submitted) expenses that are not yet paid, anchored to their planned payment date. Refused and paid expenses are excluded.
- **BR-23 (M8, D):** Overdue invoices (due date before the reference date) are included in every forecast horizon because their due date is on or before any future date.
- **BR-24 (M8, D):** Forecast dates are calendar dates without time. Comparisons use date-only values.
- **BR-25 (M9, A):** A simulation never mutates real data. It reads aggregates, applies hypotheses to an in-memory copy of the forecast inputs, and returns a separate result. Repositories are not called to save during a simulation.
- **BR-26 (M9, D):** Hypothesis types are: client delay (shift one or more invoice due dates by N days), new expense (add a planned disbursement), expected extra income (add an expected receipt). Each hypothesis is validated before application.
- **BR-27 (M9, A+D):** A simulation output contains both the base and the simulated forecast (balances at reference + 30/60/90 days), the difference, and the shortage windows (dates where the balance is negative, with amount and cause).
- **BR-28 (M10, D+A):** Alerts are: invoice overdue, expense waiting for approval, forecast balance negative within the horizon. Each alert references the underlying entity.
- **BR-29 (X, D):** Money is stored and calculated as integer millimes (1 DT = 1000 millimes). No floating point is used in domain or application code.
- **BR-30 (X, A):** All inputs are validated at the edge with Zod (shape) and again by the domain (rules). Zod schemas contain no business rules.
- **BR-31 (X, D+A):** Every financial operation that is validated keeps its history; any correction is a new traceable operation. Deletion of validated financial data is forbidden.
- **BR-32 (M2, D):** A customer or supplier belongs to exactly one company. History of invoices and payments is read from their linked records, not duplicated.

## 5. Forecast engine specification

**Purpose:** produce a dated projection of cash so the team can see a shortage before it happens.

**Inputs:**
- `referenceDate` (date-only): the date the forecast is computed from.
- `referenceBalance` (Money): real balance as of `referenceDate` (sum of movements with date ≤ referenceDate, including opening balance).
- `expectedReceipts`: list of `{ invoiceId, dueDate, remainingAmount }` for non-cancelled validated/partially paid invoices.
- `plannedDisbursements`: list of `{ expenseId, plannedDate, amount }` for non-paid, non-refused expenses included in the forecast.
- `horizonDays`: 30, 60, 90 (and arbitrary dates).

**Formula (per target date `D`):**

```
forecastBalance(D) = referenceBalance
  + sum(remainingAmount for receipt where receipt.dueDate <= D)
  - sum(amount for disbursement where disbursement.plannedDate <= D)
```

**Date handling:**
- All dates are calendar dates. Compare with date-only values (no time, no timezone). Store and parse as `YYYY-MM-DD`.
- A partial payment does not change an invoice's due date. It reduces `remainingAmount`, which is the only value used by the forecast.
- Overdue invoices (due date < referenceDate) are included because their due date ≤ any future target date.
- Received money is never counted again: real balance already includes it, and the receipt uses the remaining amount only.
- Paid expenses are excluded from planned disbursements; their cash effect is already in the real balance via the cash movement.
- Refused expenses are excluded entirely.
- Cancelled invoices are excluded entirely.
- If an expense is approved but its planned date is before the reference date, include it in all future horizons (same rule as overdue receipts).
- Multiple movements on the same date are all included when target date ≥ that date.

**Horizons:** compute at `referenceDate + 30 days`, `+ 60 days`, `+ 90 days`. Also support arbitrary dates for charts and "as of" views.

**Worked example A — normal scenario**

Company: opening balance 5 000 DT = 5 000 000 millimes. One invoice of 3 000 DT due on 10 Nov, not yet paid. Planned expenses: 6 000 DT payable on 15 Nov. Reference date 1 Nov.

- referenceBalance = 5 000 000
- expectedReceipts = [{ due 10 Nov, remaining 3 000 000 }]
- plannedDisbursements = [{ date 15 Nov, amount 6 000 000 }]

| Target date | Receipts included | Disbursements included | Forecast |
|---|---|---|---|
| 1 Nov (ref) | 0 | 0 | 5 000 DT |
| 10 Nov | 3 000 DT | 0 | 8 000 DT |
| 15 Nov | 3 000 DT | 6 000 DT | 2 000 DT |
| +30 (1 Dec) | 3 000 DT | 6 000 DT | 2 000 DT |

No negative balance, but the margin after 15 Nov is thin.

**Worked example B — client pays 20 days late**

Same data, but the client pays on 30 Nov instead of 10 Nov. The invoice due date is shifted to 30 Nov in the scenario (simulation), or in reality the payment arrives late. Using the delayed due date:

- expectedReceipts = [{ due 30 Nov, remaining 3 000 000 }]

| Target date | Receipts included | Disbursements included | Forecast |
|---|---|---|---|
| 1 Nov (ref) | 0 | 0 | 5 000 DT |
| 10 Nov | 0 | 0 | 5 000 DT |
| 15 Nov | 0 | 6 000 DT | **−1 000 DT** |
| 30 Nov | 3 000 DT | 6 000 DT | 2 000 DT |

Shortage window: 15 Nov → 29 Nov, minimum −1 000 DT on 15 Nov. This is the number the dashboard must show and explain.

**Partial payment variant (unit-test candidate):** invoice 3 000 DT, payment of 1 000 DT received on 5 Nov. Remaining = 2 000 DT, due date still 10 Nov. Real balance becomes 6 000 DT. Forecast at 15 Nov = 6 000 + 2 000 − 6 000 = 2 000 DT. The received 1 000 DT is counted once, in the real balance, and excluded from expected receipts.

**Overdue variant (unit-test candidate):** invoice 3 000 DT due 25 Oct, reference date 1 Nov, nothing paid. Expected receipt included at reference date and all horizons. Forecast at 1 Nov = 5 000 + 3 000 − 0 = 8 000 DT. This reflects the assumption that the money is still expected; the alert module separately flags it as overdue.

## 6. Simulation specification

**Scenario model:** a `Scenario` belongs to a company and contains a list of hypotheses applied on top of a base forecast context (reference date + base balances/inputs). It stores only hypotheses and metadata, not a full copy of company data. A scenario never writes to invoices, expenses, payments or cash movements.

**Hypothesis types:**
- `ClientDelay`: `{ invoiceId, delayDays }` — shifts that invoice's due date by `delayDays` in the scenario's forecast inputs. If several invoices are delayed, add one hypothesis per invoice.
- `NewExpense`: `{ amount, plannedDate, category, description }` — adds a planned disbursement.
- `ExtraIncome`: `{ amount, expectedDate, description }` — adds an expected receipt (one-off or from a new invoice).

**Guarantee "never mutates real data":** the simulation use case loads the real aggregates, builds in-memory adjusted inputs, runs the forecast engine, and returns the result. It calls no `save`/`update` on real repositories. Scenarios may be persisted as separate records, but only their hypotheses. Tests must assert that invoice/expense/payment repositories are unchanged after a simulation.

**Comparison output:** for the base and the simulated forecast, provide balances at reference date and at 30/60/90 days; the delta at each point; the first date the balance goes negative (if any); the minimum balance and its date; and a human-readable list of the hypotheses applied with their effect. The UI shows base (solid) and simulated (dashed) lines plus a "−1 000 DT on 15 Nov" style chip.

## 7. Money handling decision

- Currency: Tunisian Dinar (DT / TND), 3 decimals (millimes). 1 DT = 1000 millimes.
- Store money as **integers** (millimes) in the database and in the domain. Never use floating point for money.
- Introduce a `Money` value object in `packages/domain`: wraps an integer `amount` and a currency code, with `add`, `subtract`, `compare`, `isNegative`, `isZero`, equality and formatting helpers. Operations require the same currency.
- Rounding policy: calculations are exact in integer millimes. Division (if ever needed, e.g. pro-rata) rounds to the nearest millime, ties away from zero, and must be explicitly documented and tested. (Assumption: no tax/VAT in MVP; if added, document the rounding rule.)
- Display formatting is presentation-only: French `2 000,000 DT` (space thousands, comma decimal, 3 decimals) or English `2,000.000 DT`. Store nothing formatted.
- Database columns for money: integer (bigint or int depending on expected range). Use bigint to be safe.

## 8. Draft domain model

**Aggregates (roots):**
- `Company` — id, name, sector, openingBalance (Money), createdAt. Owns memberships.
- `Party` (customer/supplier) — id, companyId, type, name, contact info, createdAt.
- `Invoice` — id, companyId, customerId, number, issueDate, dueDate, lines, total (Money), status, cancellation reason, timestamps.
- `Payment` — id, companyId, invoiceId, amount (Money), paymentDate, method, note, recordedBy, createdAt. (Separate aggregate for audit and traceability.)
- `Expense` — id, companyId, submittedBy, category, description, amount (Money), expenseDate, receipt reference, status, approval info, payment info, timestamps.
- `CashMovement` — id, companyId, type (Opening, InvoicePayment, ExpensePayment, Adjustment, Reversal), signed amount (Money), movementDate, source reference, actor, reason, createdAt.
- `Scenario` — id, companyId, name, baseReferenceDate, hypotheses, createdBy, createdAt.
- `User` — id, email, name, password credential (hash stored via port), createdAt.
- `Membership` — userId, companyId, role (Owner, FinanceManager, Collaborator).

**Entities / value objects:**
- Value objects: `CompanyId`, `UserId`, `InvoiceId`, `PaymentId`, `ExpenseId`, `ScenarioId`, `PartyId`, `Money`, `Email`, `InvoiceNumber`, `DateOnly` (calendar date), `MembershipRole`.
- `InvoiceLine`: description, quantity, unitPrice (Money), lineTotal (Money) — value object or entity inside Invoice.
- `Hypothesis`: discriminated union value object (ClientDelay / NewExpense / ExtraIncome).

**Domain errors (stable codes):**
- `ACCESS_DENIED`
- `INVALID_TRANSITION`
- `INVALID_MONEY_AMOUNT`
- `CURRENCY_MISMATCH`
- `INVOICE_NOT_FOUND`
- `INVOICE_NOT_PAYABLE`
- `INVOICE_ALREADY_PAID`
- `INVOICE_HAS_PAYMENTS`
- `PAYMENT_EXCEEDS_REMAINING`
- `DUPLICATE_OPERATION`
- `EXPENSE_NOT_FOUND`
- `EXPENSE_NOT_APPROVED`
- `EXPENSE_ALREADY_PAID`
- `REFUSED_EXPENSE_CANNOT_BE_PAID`
- `COMPANY_NOT_FOUND`
- `USER_NOT_FOUND`
- `SCENARIO_HYPOTHESIS_INVALID`
- `FORBIDDEN` (alias of access denied where clearer)

**Domain services:**
- `ForecastEngine` (pure): computes forecast balances for dates from reference balance + expected receipts + planned disbursements.
- `CashBalanceCalculator` (pure): sums cash movements + opening balance.
- `ScenarioEngine` (pure): applies hypotheses to forecast inputs.
- `AlertEvaluator` (pure): derives alerts from invoices, expenses and forecast.

**Ports (application layer, business vocabulary):**
- Repositories: `CompanyRepository`, `UserRepository`, `MembershipRepository`, `PartyRepository`, `InvoiceRepository`, `PaymentRepository`, `ExpenseRepository`, `CashMovementRepository`, `ScenarioRepository`, `AuditLogRepository`.
- Cross-cutting: `Clock` (`today(): DateOnly`, `now(): Date`), `IdGenerator`, `SessionReader` (current user/company from the server session), `IdentityProvider` (OAuth account linking), `FileStorage`, `PdfExporter`, `Logger`, `Notifier` (optional), `TransactionManager` (or unit-of-work method on repositories).
- Auth/session: OAuth through Auth.js (or equivalent). No custom password storage in MVP; `PasswordHasher` is optional and only needed if a credentials provider is added later. The domain never sees HTTP or OAuth tokens.

Repository method names in business vocabulary: `byId`, `byCompany`, `save`, `remove` (only for drafts where allowed), `nextInvoiceNumber`, `paymentsForInvoice`, `movementsForCompany`. Never `findMany`/`where`/`select`.

## 9. Mapping to the monorepo packages

Database note: use MongoDB Atlas with a Mongoose-based adapter (or Prisma MongoDB if preferred). Keep the same layering: `packages/db` owns connection/schemas, `packages/infra` owns repositories/mappers, and only `infra` imports `db`.

Per module, where the code lives (all modules follow the same split):

| Module | Domain | Application | Infra | DB | UI | apps/web |
|---|---|---|---|---|---|---|
| M1 Company & access | Company, User, Membership, roles | RegisterCompany, InviteMember, ChangeRole, RemoveMember, GetCompany | Prisma repos, PasswordHasher adapter | Company, User, Membership tables | Member list, role chips | Routes, forms, proxy |
| M2 Parties | Party | CreateParty, UpdateParty, ListParties, GetPartyHistory | PrismaPartyRepository | Party table | Party cards | Pages |
| M3 Invoicing | Invoice, InvoiceLine, InvoiceNumber, status machine | CreateDraft, UpdateDraft, Validate, Cancel, Get, List, ExportPdf | PrismaInvoiceRepository, PdfExporter adapter | Invoice, InvoiceLine tables | Invoice list/detail, status chips | Pages, actions, Zod |
| M4 Receipts | Payment | RecordPayment, ListPayments | PrismaPaymentRepository | Payment table | Payment form | Actions |
| M5/M6 Expenses | Expense, status machine | SubmitExpense, AttachReceipt, Approve, Refuse, MarkPaid, List | PrismaExpenseRepository, FileStorage adapter | Expense table | Expense list, approval UI | Pages, actions |
| M7 Cash | CashMovement, balance calculator | SetOpeningBalance, RecordAdjustment, ListMovements, GetBalance | PrismaCashMovementRepository (transactional) | CashMovement table | Balance tile, movement list | Pages |
| M8 Forecast | ForecastEngine | GetForecast, GetForecastSeries | (none new) | (none) | Forecast chart, KPIs | Pages |
| M9 Simulation | Scenario, Hypothesis, ScenarioEngine | CreateScenario, AddHypothesis, RunSimulation, Compare | PrismaScenarioRepository | Scenario, Hypothesis tables | Scenario cards, comparison chart | Pages, actions |
| M10 Alerts/dashboard | AlertEvaluator | GetDashboard, ListAlerts | (none new) | (none) | Dashboard, alert list | Pages |

Cross-cutting packages:
- `packages/domain`: all entities, value objects, errors, domain services. Pure TypeScript.
- `packages/application`: use cases, ports, DTOs, `Result`.
- `packages/infra`: Prisma repositories, mappers, adapters (PDF, file storage, password hashing, clock).
- `packages/db`: Prisma schema, migrations, seed, client.
- `packages/ui`: shared presentational components (chips, tiles, charts wrappers).
- `packages/config`: tsconfig, ESLint, Tailwind preset, typed env.
- `apps/web`: App Router routes, Server Actions, Zod schemas, presentation components, composition root.

## 10. Multi-tenancy, authentication and security

Authentication note: OAuth via Auth.js/NextAuth (or Clerk if we prefer a managed free tier). Sessions use secure, httpOnly, SameSite cookies with a short max age and idle timeout; refresh tokens rotate; no long-lived bearer tokens in the browser. Redux stores only non-sensitive UI state.

- `companyId` is a field of every aggregate and every table. There is no global data.
- Every use case receives an `Actor` value: `{ userId, companyId, role }`. The use case loads the membership from `MembershipRepository` and verifies it instead of trusting the client.
- Repositories take `companyId` (or the aggregate carries it and the adapter filters by it). No repository method returns data across companies.
- Server Actions derive the actor from the server-side session. The company id is never accepted from the client without a membership check.
- Middleware (`proxy.ts` in Next.js 16+, per the skill) only checks session presence for URL groups. It does not query the database or check business permissions.
- Forbidden actions return typed errors (`AccessDenied`/`Forbidden`) and are blocked on the server, not only hidden in the UI.
- Audit and traceability records include `companyId` and `actorId`.
- A user may switch active company only if a membership exists; the switch is server-side.

## 11. Traceability

- Validated financial operations are **never deleted**. Invoices, payments, expenses and cash movements keep their history.
- Corrections are new traceable operations: a reversal or adjustment `CashMovement` linked to the original operation, with reason, actor and timestamp. The original remains unchanged.
- Invoice cancellation is allowed only when no payment has been recorded; otherwise a credit note / reversal flow is required (assumption to validate).
- Expense decisions (approve/refuse) and payments are appended as history, not overwritten.
- `AuditLogRepository` records significant actions: who, when, what, before/after, company. (Optional but recommended for the "Permissions and traceability" grading criterion.)
- Corrections require a reason and create a new operation; the UI always shows the history.

## 12. Risks, ambiguities and traps

- **Overpayment:** a payment above the remaining amount must be rejected server-side; concurrent payments need a transaction and a lock to avoid overpaying.
- **Refused then paid:** state machine must block `Refused→Paid`; also block creating a cash movement for a refused expense.
- **Double counting in forecast:** use remaining amounts only; never add received payments again; exclude paid expenses; exclude cancelled invoices and refused expenses.
- **Expense approved but unpaid:** included in planned disbursements until paid; when paid, remove from planned (status change) and add the cash movement; the status transition prevents double counting.
- **Invoice cancelled after partial payment:** blocked unless a reversal flow exists. Decide before V1.
- **Overdue receipts in forecast:** included in all horizons by the due-date rule; this can overstate cash if the client will never pay. The alert module flags overdue; the team may later add a "doubtful" status (original feature candidate).
- **Date-only handling:** due dates and planned dates must be calendar dates. Do not store them as timestamps or convert through local time zones.
- **Reference balance timing:** include movements with date ≤ reference date. Future-dated movements are not in the real balance but may be planned disbursements/receipts.
- **Multi-company membership:** active company selection and permission checks must be server-side; never trust a client-sent company id.
- **Money as floats:** forbidden. All money in millimes as integers.
- **Hidden `new Date()`:** domain methods take `now` as a parameter or use a `Clock` port; no hidden current time in rules.
- **Anemic domain:** state machines and calculations must live in entities/domain services, not in components or use cases.
- **Prisma leakage:** `@prisma/client` types must not leave `packages/infra`/`packages/db`.
- **Empty use cases:** a use case that only forwards to a repository is a smell; orchestration and authorization belong there.
- **Scenario mutation:** simulation must not call `save`; tests must assert repositories unchanged.
- **Seed and demo data:** needed for defense and grading; must include the full defense scenario.

## 13. Candidate "original features" for the sector choice

The spec requires choosing a sector (digital agency, training center, shop, service company) and adding one adapted feature. Proposals:

| # | Sector | Feature | Value | Effort | Business rule added |
|---|---|---|---|---|---|
| 1 | Digital agency | Recurring retainer invoices generated on a schedule | Forecast recurring revenue; reduces manual invoicing | M | A retainer generates expected receipts at each period; cancellation stops future receipts |
| 2 | Training center | Enrollment-based installment payment plans | Tracks receivables by cohort; partial payments already supported | M | An invoice can have a payment plan with due dates; forecast uses each installment's due date |
| 3 | Shop | Supplier purchase orders feeding planned disbursements | Links expenses to suppliers and due dates | L | An expense may reference a purchase order; planned disbursement uses the supplier's due date |
| 4 | Service company | Timesheets converted to billable invoice lines | Automates invoicing from tracked hours | L | Invoice lines can be generated from approved time entries with an hourly rate |
| 5 | Any | Doubtful-debt marking on overdue invoices | Avoids overstating forecast cash | S | An invoice may be marked doubtful; doubtful remaining amounts are excluded from forecast |
| 6 | Any | Cash threshold alerts with configurable minimum balance | Warns before a shortage, not only after | S | Alert when forecast balance falls below a company-configured threshold |

Recommendation: **option 1, recurring retainer invoices for a digital agency**, effort M. It directly strengthens the core forecast (recurring expected receipts), reuses the existing invoice/payment machinery, and adds one clear business rule that is easy to test and demonstrate. Option 5 is a cheap complement if time allows.

## 14. Delivery plan mapped to the 5 milestones

Vertical slices per feature after the skeleton and the first slice, following the skill's order: skeleton → domain → use cases + ports → fakes → Prisma → interface → guard rails → delivery.

- **Milestone 1 — Cadrage (framing):** validate this document's open questions; finalize permissions matrix; choose sector and original feature; finalize money/currency decision; agree invoice/expense state machines and cancellation rules; data model; mockups (use DESIGN.md); set up repo skeleton (pnpm workspaces, turbo.json, config package, empty packages, CI skeleton, depcruise).
- **Milestone 2 — V1 (access, customers, invoices, partial payments):** domain core (Company, User, Membership, Party, Invoice, Payment, Money) + unit tests; use cases for register company, create/validate/cancel invoice, record payment; in-memory repositories + use-case tests; Prisma schema/migrations/repositories + integration tests; minimal App Router pages, Server Actions, Zod; seed demo data; demo: an invoice with a remaining amount.
- **Milestone 3 — V2 (expenses, approval, real cash):** Expense aggregate + status machine; submit/approve/refuse/pay use cases; cash movements + real balance; Prisma adapters + tests; UI with approval flow; verify balance after several operations.
- **Milestone 4 — V3 (forecast, simulation, alerts):** ForecastEngine + forecast use cases + UI chart; Scenario + hypotheses + simulation + comparison; AlertEvaluator + dashboard + alerts; E2E critical journeys; responsive + loading/error/empty states.
- **Milestone 5 — Livraison (delivery):** deployment on Vercel (root `apps/web`); no Docker. README with install, config, demo accounts, tests, limitations and declaration of AI/external resources; seed demo accounts; defense scenario rehearsal; individual code explanation readiness.

## 15. Open questions for the team

All open questions are now decided using the recommended defaults:

1. Authentication: OAuth via Auth.js — decided.
2. UI language: English — decided.
3. Currency: DNT, integer millimes, English display — decided.
4. Git workflow: default feature branches + PRs — decided.
5. Database: MongoDB Atlas — decided.
6. Deployment: Vercel only — decided.
7. PDF export: easiest option (server-side PDF library, printable HTML fallback) — decided.
8. Sector/original feature: digital agency + recurring retainer invoices — decided.
9. Cancellation after partial payment: block entirely — decided.
10. Forecast planned disbursements: approved expenses only — decided.
11. Collaborator experience: no dashboard — decided.
12. Scenarios: persisted and shareable — decided.
13. Team size: 3 members — decided.

Logging choice: use the easiest free option first — Vercel built-in logs plus Axiom free tier for structured logs; add Sentry later only if needed. UI components: shadcn/ui. File storage: Cloudinary. Email: Resend.

Additional ambiguities to settle during framing: exact invoice number format, whether expenses can be partially paid, whether multiple companies per user are needed in MVP, and whether audit logs are mandatory for grading/demo.
