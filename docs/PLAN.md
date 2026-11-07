# CashPilot — Delivery Plan

This plan leads from the current skeleton to a deployed, defended application. It is organized in phases. Each phase should end with the checks from `.opencode/skills/clean-nextjs-monorepo/SKILL.md` and a small commit.

## Phase 0 — Already done

- Documentation: `PROJECT.md`, `ARCHITECTURE.md`, `DESIGN.md`, `UNDERSTANDING.md`, `TEAM-GUIDE.md`.
- Monorepo skeleton: `apps/web`, `packages/domain`, `application`, `infra`, `db`, `ui`, `config`.
- Config: TypeScript, ESLint, Tailwind, env, CI, dependency-cruiser.
- No application code yet.

## Phase 1 — Backend foundation (no UI)

Goal: make the system buildable and testable before pages.

1. Database connection
   - MongoDB Atlas connection in `packages/db`.
   - Typed env validation in `packages/config`.
   - Connection reuse in development.

2. Domain layer
   - Value objects: `Money`, `DateOnly`, ids, `Email`, `InvoiceNumber`.
   - Entities: `Company`, `User`, `Membership`, `Party`, `Invoice`, `InvoiceLine`, `Payment`, `Expense`, `CashMovement`, `Scenario`, `Hypothesis`.
   - State machines: invoice and expense transitions.
   - Domain errors with stable codes.
   - Domain services: `ForecastEngine`, `CashBalanceCalculator`, `ScenarioEngine`, `AlertEvaluator`.

3. Application layer
   - `Result<T>` or typed errors.
   - Ports: repositories, `Clock`, `IdGenerator`, `SessionReader`, `IdentityProvider`, `FileStorage`, `PdfExporter`, `Logger`, `TransactionManager`.
   - Use cases by module (see route list below).

4. Infrastructure layer
   - Mongoose schemas and models.
   - Repository adapters implementing ports.
   - Mappers between Mongo documents and domain aggregates.
   - In-memory adapters for tests/demo.
   - OAuth adapter (Auth.js).
   - File storage adapter (Cloudinary).
   - PDF exporter adapter.
   - Logger adapter (Axiom/Vercel logs).

5. Seed and demo data
   - 3 demo users (owner, finance manager, collaborator).
   - 1 demo company.
   - Customers, invoices, partial payment, expenses, cash movements.
   - Scenario matching the defense flow.

## Phase 2 — Backend routes and use cases

The app should use Server Actions for its own UI. HTTP Route Handlers are only for external clients, OAuth and PDF export.

### Auth

- `GET/POST /api/auth/[...nextauth]` — OAuth (Auth.js).
- Server-side session reader used by all use cases.

### Company and access

Use cases:
- `RegisterCompany`
- `GetCompany`
- `UpdateCompany`
- `InviteMember`
- `ChangeMemberRole`
- `RemoveMember`

### Parties

Use cases:
- `CreateParty`
- `UpdateParty`
- `ListParties`
- `GetPartyHistory`

### Invoicing

Use cases:
- `CreateInvoiceDraft`
- `UpdateInvoiceDraft`
- `ValidateInvoice`
- `CancelInvoice`
- `GetInvoice`
- `ListInvoices`
- `ExportInvoicePdf`

HTTP:
- `GET /api/invoices/[id]/pdf`

### Receipts

Use cases:
- `RecordPayment`
- `ListPaymentsForInvoice`

### Expenses

Use cases:
- `SubmitExpense`
- `AttachReceipt`
- `UpdateSubmittedExpense`
- `ListExpenses`
- `GetExpense`
- `ApproveExpense`
- `RefuseExpense`
- `MarkExpensePaid`

### Cash

Use cases:
- `SetOpeningBalance`
- `RecordAdjustment`
- `ListCashMovements`
- `GetRealBalance`

### Forecast

Use cases:
- `GetForecast`
- `GetForecastSeries`

### Simulation

Use cases:
- `CreateScenario`
- `AddHypothesis`
- `RunSimulation`
- `CompareScenarios`
- `ListScenarios`
- `GetScenario`

### Alerts and dashboard

Use cases:
- `GetDashboard`
- `ListAlerts`

### Original feature: recurring retainers

Use cases:
- `CreateRetainer`
- `UpdateRetainer`
- `PauseRetainer`
- `ResumeRetainer`
- `GenerateRetainerInvoices`
- `ListRetainers`

## Phase 3 — Frontend pages (vertical slices)

Each page must have loading, error and empty states. Data is read through use cases in Server Components. Mutations are Server Actions.

Route map:
- `/` — redirect to `/dashboard` when authenticated, otherwise `/login`.
- `/login` — OAuth sign-in.
- `/dashboard` — balances, alerts, KPIs, forecast summary.
- `/parties` — customer/supplier list.
- `/parties/[id]` — party details and history.
- `/invoices` — invoice list with filters.
- `/invoices/new` — create draft.
- `/invoices/[id]` — invoice detail, payments, cancel, export PDF.
- `/invoices/[id]/edit` — edit draft.
- `/expenses` — expense list with filters.
- `/expenses/new` — submit expense.
- `/expenses/[id]` — expense detail, approval actions, payment.
- `/cash` — real balance, movements, opening balance, adjustments.
- `/forecast` — 30/60/90 forecast chart and explanation.
- `/simulations` — scenario list and creation.
- `/simulations/[id]` — scenario detail and comparison.
- `/settings/company` — company profile.
- `/settings/members` — members and roles.

Example vertical slice: invoice detail page
- Page: `/invoices/[id]`.
- Server Component calls `GetInvoice`, `ListPaymentsForInvoice`.
- Client components: payment form, cancel button, export button.
- Server Actions: `RecordPayment`, `CancelInvoice`.
- Zod schemas for payment input.
- Revalidate `/invoices`, `/invoices/[id]`, `/cash`, `/forecast`.
- Tests: domain payment rule, use case, E2E payment flow.

## Phase 4 — Quality and delivery

1. Tests
   - Domain unit tests for every business rule.
   - Use-case tests with in-memory fakes.
   - Infra integration tests against MongoDB.
   - E2E: login, invoice, partial payment, expense approval, forecast, simulation.

2. Guard rails
   - dependency-cruiser.
   - Typed env.
   - GitHub Actions CI.

3. Deployment
   - Vercel project with root directory `apps/web`.
   - MongoDB Atlas production database.
   - OAuth production credentials.
   - Seed production demo data.

4. Documentation
   - README: install, config, demo accounts, tests, limitations.
   - Declare AI tools and external resources.
   - Architecture justification.

## Build order

1. Domain value objects and entities.
2. First vertical slice: company + invoice + payment.
3. Expenses and cash.
4. Forecast and alerts.
5. Simulation.
6. Retainers.
7. UI polish, responsive states, E2E, deployment.
EOF
echo done