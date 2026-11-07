# CashPilot — Full Delivery Plan

This is the working plan for building the complete application. It is organized by preparation first, then feature/page slices. Each slice includes domain, use cases, infrastructure, UI, validation, tests and delivery notes.

## 0. Project goal

CashPilot is a multi-company cash-flow application. It tracks real cash, forecasts cash at 30/60/90 days, simulates decisions, and controls expenses. It is built as a pnpm + Turborepo monorepo with Next.js App Router and Clean Architecture. The UI is in English. Money is stored as integer millimes in DNT.

## 1. Non-negotiable architecture rules

- Domain depends on nothing.
- Application depends only on domain.
- Infra depends on application, domain and db.
- db is Mongo-only and only infra imports it.
- Presentation depends on application, ui and config.
- Composition root is the only place that imports infra.
- No Prisma/DB calls in pages, components or Server Actions.
- Business rules live in domain entities/domain services.
- Authorization is checked in use cases.
- Zod validates shape; domain validates rules.
- Money is integer millimes; never floats.
- Dates are calendar dates without time.
- No long-lived tokens; OAuth sessions use secure short-lived cookies.
- Validated financial operations are never deleted; corrections are traceable.

## 2. Phase 1 — Backend preparation only

Goal: create the rich base that feature work will reuse. Do not implement all use cases yet.

### 2.1 MongoDB connection and environment

Files:
- `packages/db/src/index.ts`
- `packages/config/src/env.ts`

Work:
- Connect to MongoDB Atlas using `DATABASE_URL`.
- Reuse the connection in development.
- Validate env vars at startup with Zod.
- Expose only safe config to the app.

### 2.2 Rich schemas

All schemas are company-scoped and indexed. They store money as integers and dates as date-only values.

Collections and key fields:

`companies`
- `_id`, `name`, `sector`, `openingBalanceMillimes`, `currency`, `forecastThresholdMillimes`, `createdAt`, `updatedAt`

`users`
- `_id`, `email`, `name`, `oauthProvider`, `oauthSubject`, `createdAt`, `updatedAt`

`memberships`
- `_id`, `userId`, `companyId`, `role` (`owner`, `finance_manager`, `collaborator`), `createdAt`

`parties`
- `_id`, `companyId`, `type` (`customer`, `supplier`), `name`, `email`, `phone`, `address`, `createdAt`, `updatedAt`

`invoices`
- `_id`, `companyId`, `customerId`, `number`, `status` (`draft`, `validated`, `partially_paid`, `paid`, `cancelled`)
- `issueDate`, `dueDate`
- `totalMillimes`
- `remainingMillimes`
- `cancelledReason`, `cancelledAt`, `cancelledBy`
- `createdAt`, `updatedAt`

`invoiceLines` (embedded in invoice or separate; recommended embedded)
- `description`, `quantity`, `unitPriceMillimes`, `lineTotalMillimes`

`payments`
- `_id`, `companyId`, `invoiceId`, `amountMillimes`, `paymentDate`, `method`, `note`, `recordedBy`, `createdAt`

`expenses`
- `_id`, `companyId`, `submittedBy`, `category`, `description`, `amountMillimes`, `expenseDate`
- `receiptFileId`
- `status` (`submitted`, `approved`, `refused`, `paid`)
- `approval` (`approver`, `decisionDate`, `reason`)
- `payment` (`paidBy`, `paidDate`, `amountMillimes`)
- `createdAt`, `updatedAt`

`cashMovements`
- `_id`, `companyId`, `type` (`opening`, `invoice_payment`, `expense_payment`, `adjustment`, `reversal`)
- `amountMillimes` (signed)
- `movementDate`
- `sourceType`, `sourceId`
- `actorId`, `reason`, `createdAt`

`scenarios`
- `_id`, `companyId`, `name`, `baseReferenceDate`, `createdBy`, `createdAt`, `updatedAt`

`hypotheses` (embedded in scenario)
- `type` (`client_delay`, `new_expense`, `extra_income`)
- `invoiceId`, `delayDays`
- `amountMillimes`, `plannedDate`, `category`, `description`
- `expectedDate`

`auditLogs`
- `_id`, `companyId`, `actorId`, `entityType`, `entityId`, `action`, `before`, `after`, `reason`, `createdAt`

Indexes:
- every collection: `{ companyId: 1, createdAt: -1 }`
- memberships: `{ userId: 1, companyId: 1 }` unique
- invoices: `{ companyId: 1, number: 1 }` unique
- invoices: `{ companyId: 1, status: 1, dueDate: 1 }`
- payments: `{ companyId: 1, invoiceId: 1 }`
- expenses: `{ companyId: 1, status: 1, expenseDate: 1 }`
- cashMovements: `{ companyId: 1, movementDate: 1 }`
- scenarios: `{ companyId: 1, createdAt: -1 }`

### 2.3 Domain model

Aggregates:
- `Company`
- `User`
- `Membership`
- `Party`
- `Invoice`
- `Payment`
- `Expense`
- `CashMovement`
- `Scenario`

Value objects:
- `Money`
- `DateOnly`
- `CompanyId`, `UserId`, `InvoiceId`, `PaymentId`, `ExpenseId`, `ScenarioId`, `PartyId`
- `Email`, `InvoiceNumber`, `MembershipRole`

State machines:
- Invoice: `draft -> validated`, `draft -> cancelled`, `validated -> partially_paid`, `validated -> paid`, `partially_paid -> paid`; cancellation blocked if payments exist.
- Expense: `submitted -> approved`, `submitted -> refused`, `approved -> paid`; refused can never be paid.

Domain errors:
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

Domain services:
- `ForecastEngine`
- `CashBalanceCalculator`
- `ScenarioEngine`
- `AlertEvaluator`

### 2.4 Ports

Repositories:
- `CompanyRepository`
- `UserRepository`
- `MembershipRepository`
- `PartyRepository`
- `InvoiceRepository`
- `PaymentRepository`
- `ExpenseRepository`
- `CashMovementRepository`
- `ScenarioRepository`
- `AuditLogRepository`

Cross-cutting:
- `Clock`
- `IdGenerator`
- `SessionReader`
- `IdentityProvider`
- `FileStorage`
- `PdfExporter`
- `Logger`
- `TransactionManager`

### 2.5 Adapters

- Mongo repositories in `packages/infra/src/mongo`.
- Mappers in `packages/infra/src/mappers`.
- In-memory repositories for tests and demo mode.
- Auth.js OAuth adapter.
- Cloudinary file storage adapter.
- PDF exporter adapter.
- Axiom/Vercel logger adapter.

### 2.6 API configuration

- OAuth routes through Auth.js.
- Shared Server Action helper: parse with Zod, call use case, map domain errors, revalidate paths.
- Invoice PDF route: `GET /api/invoices/[id]/pdf`.
- Audit event shape for sensitive actions.

## 3. Phase 2 — Feature slices

Each feature is built vertically: domain rules, use cases, infra, UI, tests. Shared schema and ports are reused.

### Slice 1 — Auth, company, dashboard shell

Routes:
- `/login`
- `/dashboard`
- `/settings/company`
- `/settings/members`

Backend:
- `SessionReader`
- `RegisterCompany`
- `GetCompany`
- `UpdateCompany`
- `InviteMember`
- `ChangeMemberRole`
- `RemoveMember`

UI:
- OAuth sign-in page.
- Dashboard shell with navigation.
- Company settings form.
- Member list and role management.

Validation:
- Authenticated user required.
- Owner-only member management.

Tests:
- Membership authorization use cases.
- E2E sign-in and company setup.

### Slice 2 — Parties

Routes:
- `/parties`
- `/parties/[id]`

Backend:
- `Party` entity.
- `CreateParty`
- `UpdateParty`
- `ListParties`
- `GetPartyHistory`

UI:
- Party list with search/filter.
- Party detail page with invoice/payment history.

Validation:
- Company scoping.
- Required name and type.

Tests:
- Party repository integration.
- E2E create party and view history.

### Slice 3 — Invoices and partial payments

Routes:
- `/invoices`
- `/invoices/new`
- `/invoices/[id]`
- `/invoices/[id]/edit`

Backend:
- `Invoice` and `InvoiceLine`.
- `CreateInvoiceDraft`
- `UpdateInvoiceDraft`
- `ValidateInvoice`
- `CancelInvoice`
- `GetInvoice`
- `ListInvoices`
- `RecordPayment`
- `ListPaymentsForInvoice`
- `ExportInvoicePdf`

UI:
- Invoice list with status filters.
- Invoice creation/edit forms.
- Invoice detail page.
- Payment form.
- Cancel and export actions.

Rules:
- Payment amount must be positive and not exceed remaining.
- Cancel allowed only when no payments exist.
- Validated/partially paid invoices feed forecast.

Tests:
- Payment exceeds remaining.
- Partial payment reduces remaining.
- Invoice cancellation with payments.
- E2E invoice + partial payment flow.

### Slice 4 — Expenses and approval

Routes:
- `/expenses`
- `/expenses/new`
- `/expenses/[id]`

Backend:
- `Expense` entity.
- `SubmitExpense`
- `AttachReceipt`
- `UpdateSubmittedExpense`
- `ListExpenses`
- `GetExpense`
- `ApproveExpense`
- `RefuseExpense`
- `MarkExpensePaid`

UI:
- Expense list with status filters.
- Expense submission form with receipt upload.
- Expense detail page.
- Approve/refuse buttons for owner.
- Mark paid action.

Rules:
- Refused expense cannot be paid.
- Only approved expense can be paid.
- Paid expense creates one cash movement.

Tests:
- Refused expense payment blocked.
- Double payment blocked.
- E2E submit/approve/pay expense.

### Slice 5 — Cash

Route:
- `/cash`

Backend:
- `CashMovement` entity.
- `SetOpeningBalance`
- `RecordAdjustment`
- `GetRealBalance`
- `ListCashMovements`

UI:
- Real balance display.
- Movement list.
- Opening balance form.
- Adjustment form.

Rules:
- Real balance = opening balance + sum movements.
- Corrections create reversal/adjustment movements.
- Validated operations are not deleted.

Tests:
- Balance calculation.
- Adjustment creates movement.
- E2E set opening balance and view movement.

### Slice 6 — Forecast

Route:
- `/forecast`

Backend:
- `ForecastEngine`
- `GetForecast`
- `GetForecastSeries`

UI:
- Forecast chart with 30/60/90 day points.
- Explanation of inputs and assumptions.
- Shortage highlighting.

Rules:
- Forecast = reference balance + expected receipts by due date - planned disbursements by planned date.
- Use remaining amounts only.
- Overdue invoices included by due date.
- Date-only comparisons.

Tests:
- Normal scenario expected output.
- Late payment scenario expected output.
- Partial payment scenario expected output.
- Overdue scenario expected output.

### Slice 7 — Alerts

Route:
- `/dashboard` alert section

Backend:
- `AlertEvaluator`
- `GetDashboard`
- `ListAlerts`

UI:
- Alert list on dashboard.
- Alert badges and links to entities.

Rules:
- Alerts for overdue invoices.
- Alerts for expenses waiting approval.
- Alerts for negative forecast balance.

Tests:
- Alert generation rules.
- E2E dashboard alert visibility.

### Slice 8 — Simulation

Routes:
- `/simulations`
- `/simulations/[id]`

Backend:
- `Scenario` and `Hypothesis`.
- `CreateScenario`
- `AddHypothesis`
- `RunSimulation`
- `CompareScenarios`
- `ListScenarios`
- `GetScenario`

UI:
- Scenario list.
- Scenario creation form.
- Comparison view with base vs simulated lines.
- Hypothesis list and effect summary.

Rules:
- Simulation never mutates real data.
- Hypotheses: client delay, new expense, extra income.
- Output includes deltas and shortage windows.

Tests:
- Scenario does not mutate repositories.
- Comparison output expected values.
- E2E create scenario and compare.

### Slice 9 — Recurring retainers

Routes:
- `/invoices` retainer section or `/settings/retainers`

Backend:
- `CreateRetainer`
- `UpdateRetainer`
- `PauseRetainer`
- `ResumeRetainer`
- `GenerateRetainerInvoices`
- `ListRetainers`

UI:
- Retainer list.
- Retainer creation/edit form.
- Generate invoices action.

Rules:
- Retainer generates expected receipts/invoices on schedule.
- Paused retainer stops future generation.
- Generated invoices feed forecast and invoice list.

Tests:
- Retainer invoice generation.
- Pause behavior.

## 4. Cross-cutting standards

### Money
- Store as integer millimes.
- `Money` value object with same-currency operations.
- Display formatting only in presentation.

### Dates
- Calendar dates only.
- Parse and store as `YYYY-MM-DD`.
- No timezone conversion for business dates.

### Security
- OAuth via Auth.js.
- Server-side session and authorization.
- Short-lived secure cookies.
- Rate limiting on auth and mutations.
- Least-privilege Mongo user.
- Redact secrets and PII from logs.

### Logging
- Structured JSON logs.
- Audit logs for financial/security events.
- Vercel built-in logs + Axiom free tier.
- Sentry optional later.

### UI
- English.
- shadcn/ui, Tailwind.
- Responsive, loading/error/empty states.
- Accessible navigation and forms.

## 5. Phase 3 — Quality and delivery

1. Tests
   - Domain unit tests for every business rule.
   - Use-case tests with in-memory fakes.
   - Infra integration tests against MongoDB.
   - E2E critical journeys.

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
   - README with install, config, demo accounts, tests, limitations.
   - Declare AI tools and external resources.
   - Architecture justification.

## 6. Definition of done per slice

A slice is done when:
- Domain rules are implemented and unit-tested.
- Use cases are implemented and tested with fakes.
- Mongo repository works and is integration-tested.
- UI page works with loading/error/empty states.
- Server Actions validate input and enforce authorization.
- Relevant revalidation is implemented.
- E2E path is added for critical flows.
- Checks pass: lint, typecheck, test, depcruise, build.

## 7. Risks and controls

- Overpayment: transaction + lock in repository.
- Refused expense paid: state machine blocks.
- Double counting in forecast: use remaining amounts and status filters.
- Anemic schemas: enforce validation and indexes in Mongoose.
- Prisma/Mongo leakage: types stay in infra/db.
- Scenario mutation: simulation must not call save.
- Multi-company leakage: company scoping in every query.
- Date bugs: use `DateOnly`, not timestamps.
