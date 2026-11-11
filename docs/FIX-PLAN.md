# CashPilot — Architecture Audit & Fix Plan

> **Audience:** the AI agent that will do the work (GLM 5.3 Flash) and the team reviewing it.
> **Written:** 2026-11-10, from a full read of the repo at commit `58f8c5a` against the course PDF
> `Next.js-Clean-Architecture-et-Monorepo.pdf`, `docs/PROJECT.md`, `docs/UNDERSTANDING.md` and the skill
> `.opencode/skills/clean-nextjs-monorepo/SKILL.md`.
> **Status (2026-11-11):** done and merged on `main`. Team decision: **no demo data and no demo accounts** — D10, D11, the demo login in T4.3, the seed in T3.6 and the demo parts of T5.2/T6.2/T6.3 are cancelled.

---

## 0. Rules for the agent executing this plan (read first, follow exactly)

1. Read, in this order: `AGENTS.md`, `docs/PROJECT.md`, `docs/UNDERSTANDING.md`, `.opencode/skills/clean-nextjs-monorepo/SKILL.md`, `.opencode/skills/ocp-clean-principles/SKILL.md`, then this file.
2. Before starting, change the last line of `AGENTS.md` from `Current phase: understanding — no code until instructed` to `Current phase: fixing — follow docs/FIX-PLAN.md`.
3. Work **one task at a time, in the order given** (task IDs like `T1.3`). Do not start a task before the previous one passes its checks. Do not skip ahead, do not merge tasks.
4. Each task lists: **Why**, **Files**, **Steps**, **Done when**, **Commit**. Do only what the task says. If a task is unclear or seems wrong, stop and ask the user instead of improvising.
5. After **every** task run:
   ```bash
   pnpm turbo run lint typecheck test
   pnpm depcruise          # works only after T0.1
   ```
   All must pass. Never disable a lint rule, a TypeScript option or a depcruise rule to get green. Never use `any`, `as any`, `@ts-ignore` or `eslint-disable` in new code.
6. One commit per task, message given in the task, on a feature branch (`git checkout -b fix/architecture` once at the start). End every commit message with the attribution lines required by the user's setup. Do not push unless the user asks.
7. Layer rules you must never break (from the course, slide "La règle de dépendance"):
   - `packages/domain` imports **nothing** (no mongoose, zod, next, react, `process.env`, `crypto` I/O is allowed only via `crypto.randomUUID` inside id value objects).
   - `packages/application` imports **only** `@cashpilot/domain`.
   - `packages/infra` imports application, domain, db. Never next/react.
   - `packages/db` imports only mongoose. **Only infra imports db.**
   - `apps/web` imports `@cashpilot/application`, `@cashpilot/ui`, `@cashpilot/config`. **Only `apps/web/src/container/**` may import `@cashpilot/infra`.** Nothing in `apps/web` imports `@cashpilot/domain` or `@cashpilot/db` (after T4.1).
8. Money is always integer millimes. Never `parseFloat`, never `* 1000` on a float. Dates are `YYYY-MM-DD` strings / `DateOnly`. No `new Date()` in domain or application code — use the `Clock` port.
9. Keep code simple and readable: students must explain every line at the defense. Match existing naming (kebab-case files, one use case class per file, `execute(input)`).

---

## 1. Audit summary — does the project follow the PDF architecture?

**Short answer: the skeleton follows it, the inside does not yet.** The folder layout, packages, ports and composition root match the course. But several course rules are broken, the guard rails are not actually running, and there are correctness bugs that break the defense scenario.

### 1.1 Conformance table (course slide → project state)

| Course rule (PDF slide) | State | Evidence |
|---|---|---|
| Monorepo layout `apps/web` + `packages/{domain,application,infra,db,ui,config}` (s.36) | ✅ OK | Matches. |
| pnpm workspaces, `workspace:*`, root scripts via turbo (s.37) | ✅ OK | `package.json`, `pnpm-workspace.yaml`. |
| `turbo.json` tasks build/test/lint/typecheck/dev (s.38) | ⚠️ Partial | No `env` declared for cache keys (s.46), no `depcruise` task. |
| Just-in-time packages + `transpilePackages` (s.41) | ✅ OK | `apps/web/next.config.ts`. |
| Shared tsconfig, strict (s.42) | ✅ OK | `packages/config/tsconfig/base.json`. |
| Shared ESLint + Tailwind configs (s.43) | ❌ Empty | `packages/config/eslint/base.js` exports `[]`; tailwind preset `{}`; packages have no `lint` script, so only `apps/web` is linted. |
| DB in its own package, only infra imports it (s.44, s.40 "Les apps ignorent Prisma et @acme/db") | ❌ Broken | `apps/web/package.json` depends on `@cashpilot/db`; `container/index.ts` imports `connectDb` from `@cashpilot/db`. |
| Architecture enforced by dependency-cruiser in CI (s.45) | ❌ Not running | `pnpm depcruise` runs `depcruise` with **no arguments** (prints help). Run manually it follows `node_modules` and crashes (out of memory). Rules don't cover mongoose/zod. |
| Typed env validated at startup (s.46) | ❌ Unused | `packages/config/src/env.ts` exists but `packages/config/src/index.ts` is empty; nothing imports `env`. |
| CI on push / PR (s.53) | ❌ Manual only | `.github/workflows/ci.yml` has only `workflow_dispatch`. |
| Domain: private ctor, `create()` enforces invariants, behaviour methods, no setters (s.22) | ⚠️ Partial | Ctors are private, but most invariants are missing (no name/quantity/date checks), value objects throw plain `Error`, `Retainer.pause/resume` have no rules, and "update" use cases rebuild entities with `X.create({...})` instead of calling behaviour methods (anemic). |
| Domain errors carry a stable code (s.23) | ⚠️ Partial | `DomainError` exists, but `Money`, `DateOnly`, `Email`, `InvoiceNumber` throw `new Error(...)` with no code. |
| Ports in business vocabulary (s.24) | ✅ OK | `byId`, `byCompany`, `save`. |
| Time injected via `Clock` port (s.24) | ⚠️ Partial | `DateOnly.today()` hides `new Date()`; `CreateScenario` and server actions use `new Date()`. |
| Use case orchestrates: load → domain behaviour → save (s.25) | ⚠️ Partial | Forecast selection rules are duplicated in 4 use cases; rules like "which invoices are receivable" live in use cases, not in entities. |
| Adapter `implements` port, ORM only in infra (s.26) | ✅ OK | Mongo repos implement ports. |
| Mappers separate DB model from domain model (s.27) | ❌ Missing | `packages/infra/src/mappers/index.ts` is `export {}`; mapping is inline with `any` everywhere and a file-wide `eslint-disable`. |
| Composition root is the single wiring point (s.28) | ⚠️ Broken | Container also exports raw repositories, holds 100 lines of seed data, and pages/layouts use those repositories directly. |
| Next.js is a thin layer: pages call use cases only (s.29) | ❌ Broken | `(app)/layout.tsx` and `settings/members/page.tsx` call repositories; `lib/auth-actor.ts` creates users and memberships itself; `invoices/page.tsx` re-implements the overdue rule. |
| Zod at the boundary, `safeParse`, return errors (s.31) | ⚠️ Partial | Invalid input is silently ignored (`if (!parsed.success) return;`); `addHypothesisAction` has no Zod at all. |
| Errors per layer: domain code → message/HTTP status (s.32) | ❌ Missing | Server actions never catch `DomainError`; every rule violation crashes to `error.tsx`. |
| Middleware only checks session; authorization in use cases (s.16) | ⚠️ Partial | Middleware OK. Use cases check *membership* but almost never *role* (see P0-4). |
| Tests per layer: many domain, use cases with fakes, few infra integration, 3–10 E2E (s.49–52) | ❌ Weak | **0 domain tests**, 19 use-case tests, 0 infra tests, 2 trivial E2E (login page only). |
| In-memory adapter for every repository (s.26, exercise 1) | ✅ OK | `packages/infra/src/in-memory`. |
| `ARCHITECTURE.md` justifying the choices (s.57 deliverable) | ❌ Missing | `docs/ARCHITECTURE.md` is a raw text dump of the course PDF, not a justification of *this* project. |
| Pitfalls slide (s.59): empty layers, anemic entities, internal API, `"use client"` at top, giant barrels | ⚠️ | Anemic updates (yes), giant barrels (`index.ts` re-exports everything in every package), `"use client"` correctly limited to leaves (OK), no internal API misuse (OK). |

Accepted deviations from the course (decided in `docs/UNDERSTANDING.md` §0, keep them): **MongoDB + Mongoose instead of PostgreSQL + Prisma**, **Vercel only (no Docker)**, **Auth.js OAuth**. They are fine as long as Mongo stays inside `packages/db` + `packages/infra` (the course's "replacement test").

### 1.2 Problems found, by severity

**P0 — wrong results / broken defense scenario (fix first)**

| ID | Problem | Where |
|---|---|---|
| P0-1 | `Money.subtract` throws `"Money result cannot be negative"`, and `ForecastEngine` uses it. Any forecast that goes below zero (the **headline scenario**: −1 000 DT on 15 Nov) **crashes** instead of showing a shortage. `Money.of` also rejects negatives, so `GetForecast`/`RunSimulation` crash when the real balance is negative. | `packages/domain/src/value-objects/money.ts`, `services/forecast-engine.ts`, `application/src/forecast/*`, `simulation/run-simulation.ts` |
| P0-2 | Opening balance is **counted twice**: `Company.openingBalance` (5 000 DT) **plus** an `"opening"` cash movement of 5 000 DT in the seed. Real balance shows 9 000 DT instead of 4 000 DT. | `container/index.ts` seed + `GetRealBalance`, `GetForecast`, `GetForecastSeries`, `GetDashboard`, `RunSimulation` |
| P0-3 | Every server action uses the hard-coded `demo.companyId` instead of the signed-in user's company → no multi-tenancy; writes always go to "Atlas Studio". `invoices/[id]/edit/page.tsx` even reads as `demo.ownerUserId`. | `apps/web/src/app/actions.ts`, `invoices/[id]/edit/page.tsx` |
| P0-4 | Role permissions are not enforced: a **collaborator** can create/validate/cancel invoices, record payments, mark expenses paid, record cash adjustments, see all expenses, the balance and the forecast. Only approve/refuse/members/company check the role. Violates BR-02 and the matrix in `UNDERSTANDING.md` §3. | almost every use case in `packages/application/src` |
| P0-5 | Any Google account that signs in is **automatically added to the demo company** (first one as owner). Data isolation is broken by design. | `apps/web/src/lib/auth-actor.ts` |
| P0-6 | Simulation "client delay" finds the receipt **by due date**, not by invoice id → if two invoices share a due date, the wrong one is delayed. Shortage windows are computed only on 4 points (ref, +30, +60, +90) so the 15 Nov shortage of the spec example is never shown. | `application/src/simulation/run-simulation.ts` |
| P0-7 | No atomicity on Mongo: `NoopTransactionManager` → a crash between "save payment" and "save movement" breaks BR-10/BR-17. Two concurrent payments can overpay (no concurrency check). The same form submitted twice records two payments (BR-10 duplicate). | `infra/src/adapters/transaction-manager.ts`, `record-payment.ts`, `mark-expense-paid.ts` |
| P0-8 | `SetOpeningBalance` and `UpdateCompany` **overwrite** the opening balance silently — violates traceability (BR-19/BR-31: corrections must be new traceable operations). | `application/src/cash/set-opening-balance.ts`, `company/update-company.ts` |

**P1 — architecture violations (course rules)**

| ID | Problem |
|---|---|
| P1-1 | `apps/web` depends on `@cashpilot/db` and imports `connectDb` (forbidden by s.40/s.44). `@cashpilot/infra` is only a devDependency although it is used at runtime. |
| P1-2 | Pages/layout/lib use repositories and domain classes directly (`companies.byId`, `users.byId`, `memberships.listByCompany`, `User.fromOAuth`, `Membership.create`). |
| P1-3 | Seed data lives inside the composition root and runs on first request (`ensureDb`). |
| P1-4 | Container builds `GetForecast` 4 times and `ListAlerts` twice; `CompareScenarios` news a `RunSimulation` internally (hidden wiring outside the composition root). |
| P1-5 | No mappers; `any` everywhere in `infra/src/mongo/repositories.ts`; `saveById` uses `strict:false` + `toObject` hack; payments/movements use **upsert** (append-only records can be overwritten). |
| P1-6 | Anemic updates: `UpdateInvoiceDraft`, `UpdateParty`, `UpdateCompany`, `UpdateRetainer`, `UpdateSubmittedExpense`, `ChangeMemberRole`, `AttachReceipt` rebuild the entity with `create()`/`restore()` instead of calling a behaviour method. `AttachReceipt` and `SetOpeningBalance` use `await import("@cashpilot/domain")` hacks. |
| P1-7 | Forecast input rules (which invoices/expenses count, reference balance) are copy-pasted in `GetForecast`, `GetForecastSeries`, `GetDashboard`, `RunSimulation`. The rules belong in the domain. |
| P1-8 | Domain errors: value objects throw plain `Error`; error codes are misused (`COMPANY_NOT_FOUND` for "Party not found"/"Retainer not found", `SCENARIO_HYPOTHESIS_INVALID` for "Scenario not found"). |
| P1-9 | `TransactionManager` leaks transactions into use cases (skill §4 Infrastructure: "do not leak transactions into use cases"). |
| P1-10 | `crypto.randomUUID()` called in application (`RecordAdjustment`) and infra file storage; `IdGenerator` port exists but is never used. `IdentityProvider`, `SessionReader`, `Logger`, `AuditLogRepository` ports exist but are never used. |
| P1-11 | Hidden time: `DateOnly.today()`, `new Date()` in `CreateScenario` and in `actions.ts` (decision dates). |
| P1-12 | Giant barrel files: `@cashpilot/domain` and `@cashpilot/application` `index.ts` re-export everything (pitfall s.59). Acceptable for now — **do not refactor** unless a task says so; just do not make it worse. |

**P2 — security, traceability, validation**

| ID | Problem |
|---|---|
| P2-1 | Audit log is never written (grading criterion "Permissions et traçabilité"). |
| P2-2 | Server actions silently ignore invalid input and never show domain errors to the user. |
| P2-3 | `ChangeMemberRole`/`RemoveMember` can remove/demote the **last owner** (company locked forever). |
| P2-4 | Invoice number typed freely by the user; `nextNumber` uses `countDocuments` (race → duplicate key crash). |
| P2-5 | JWT session lasts 7 days; decision was "short-lived sessions". |
| P2-6 | `packages/db/scripts/check.mjs` hard-codes a personal e-mail address and reads `.env` by path — delete it. |
| P2-7 | Env vars not validated at startup; `turbo.json` does not declare them. |
| P2-8 | `MarkExpensePaid` accepts an arbitrary `amountMillimes` different from the approved amount. |
| P2-9 | `RecordAdjustment` accepts amount `0`, any date (including future), no role check. |

**P3 — features that are fake or missing (from `docs/PROJECT.md`)**

| ID | Problem |
|---|---|
| P3-1 | PDF export returns an **empty byte array** (`InMemoryPdfExporter`). |
| P3-2 | Receipts: `InMemoryFileStorage` (lost on restart) and the form asks for a "Receipt file id" text, not a file. |
| P3-3 | Company settings page is a fake form (hard-coded "Atlas Studio", button does nothing). Members page "Invite member" / "Change role" buttons do nothing. |
| P3-4 | No onboarding: a new user cannot create a company (first step of the defense scenario). |
| P3-5 | Invoice form has hard-coded customers (`party-acme`, `party-globex`); amounts are typed in millimes; inputs have no `<label>` (accessibility). |
| P3-6 | No `loading.tsx` / `error.tsx` in the `(app)` group, few empty states. |
| P3-7 | Collaborator sees the dashboard/forecast in the nav (decision: no dashboard for collaborators). |
| P3-9 | `packages/ui` is empty; every page repeats the same inline styles and its own `formatDnt` (two different money formats exist: `lib/format.ts` English vs pages French). |
| P3-10 | README declares Tailwind/shadcn/Cloudinary/Resend/Axiom which are not used; no AI-tools declaration details; no "known limitations". |

---

## 2. Decisions this plan takes (so the agent does not improvise)

| # | Decision |
|---|---|
| D1 | `Money` becomes **signed**. `Money.of(n)` accepts any integer (negative allowed). New `Money.positive(n)` throws `INVALID_MONEY_AMOUNT` unless `n > 0`. Invoice lines, payments, expenses, retainers, hypotheses use `Money.positive`. |
| D2 | **The real balance is the sum of cash movements only.** The opening balance is a cash movement of type `"opening"`. `Company` no longer has `openingBalance`. `RegisterCompany` creates the opening movement. A company has at most one opening movement; changing it afterwards is done with an `"adjustment"` movement (traceable). |
| D3 | Permissions live in **one policy object in the domain** (`packages/domain/src/access/`), a role → permission map copied from `UNDERSTANDING.md` §3. Use cases call one application helper `authorize(...)`. Adding a role or permission = edit the map only (OCP skill). |
| D4 | Atomic multi-write operations go behind **one port method each** (no `TransactionManager` in use cases): `FinancialLedger.recordInvoicePayment(...)`, `recordExpensePayment(...)`. Mongo implementation uses `session.withTransaction` + optimistic check on the invoice's previous remaining amount. Atlas is a replica set, so transactions work. |
| D5 | Payments and cash movements are **append-only**: inserted with `create`/`insertOne`, never upserted. A duplicate id → `DUPLICATE_OPERATION`. The payment form carries a hidden `operationId` (UUID generated when the page renders) used as the payment id → double submit is rejected. |
| D6 | Invoice numbers are generated by the server (`INV-0001`, per company) using an atomic counter document (`$inc`). The number field is removed from forms. |
| D7 | Forecast rules move into entities: `Invoice.expectedReceipt()` and `Expense.plannedDisbursement()` return the forecast input or `null`. One domain function `buildForecastInputs(...)` is used by every forecast/simulation use case. |
| D8 | Simulation works on a **daily series** from reference date to +90 days; shortage windows = consecutive days with negative balance (start, end, minimum, date of minimum). Client delay matches by `invoiceId`. |
| D9 | Active company: stored in an httpOnly cookie `cp_company`; validated against memberships on every request; default = first membership. A user with no membership is redirected to `/onboarding` to create a company. **Nobody is auto-added to the demo company.** |
| D12 | Presentation imports `DomainError` / codes through `@cashpilot/application` (re-export), never `@cashpilot/domain`. |
| D13 | Money in forms is typed in **DNT** (e.g. `2000.500`) and converted to millimes with a pure string parser in `apps/web/src/lib/money-input.ts` (no float math). Display uses one formatter `lib/format.ts` (`2,000.500 DNT`, English, per `UNDERSTANDING.md` §0). |
| D14 | PDF: `pdf-lib` in `packages/infra/src/pdf/`. The `PdfExporter` port receives the invoice data (snapshot + company + customer names), not an id. |
| D15 | Receipts: Cloudinary adapter in `packages/infra/src/storage/cloudinary-file-storage.ts` when `CLOUDINARY_URL` is set, otherwise the in-memory one. Max 5 MB, `image/*` or `application/pdf`. |
| D16 | Course text moves to `docs/reference/COURSE-ARCHITECTURE.md`. `docs/ARCHITECTURE.md` becomes the project's own justification document (course deliverable). Update `AGENTS.md` and the skill's step 0 path accordingly. |

---

## 3. Work plan

Phases run in order: **0 guard rails → 1 domain → 2 application → 3 infra → 4 presentation → 5 tests & E2E → 6 docs & delivery.**

---

### Phase 0 — Guard rails first (so every later step is checked)

#### T0.1 Make dependency-cruiser actually run
- **Why:** P1 rules are only real if CI checks them (s.45). Today `pnpm depcruise` prints help.
- **Files:** `package.json`, `.dependency-cruiser.cjs`, `turbo.json`.
- **Steps:**
  1. Root script: `"depcruise": "depcruise apps packages --config .dependency-cruiser.cjs"`.
  2. In `.dependency-cruiser.cjs` add an `options` block: `doNotFollow: { path: "node_modules" }`, `exclude: { path: "(\\.next|dist|coverage|\\.turbo)/" }`, `tsConfig: { fileName: "packages/config/tsconfig/base.json" }`, `tsPreCompilationDeps: true`, `enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default"] }`.
  3. Rules (all `severity: "error"`), keep existing ones and add/adjust:
     - `domain-pure`: from `^packages/domain` to `node_modules/(mongoose|mongodb|zod|next|react|next-auth)` and to `^packages/(application|infra|db|ui|config)|^apps`.
     - `application-only-domain`: from `^packages/application` to `node_modules/(mongoose|mongodb|zod|next|react|next-auth)` and to `^packages/(infra|db|ui)|^apps`.
     - `infra-no-presentation`: from `^packages/infra` to `node_modules/(next|react|next-auth)` and to `^apps`.
     - `only-infra-imports-db`: from `pathNot: ^packages/(infra|db)` to `^packages/db`.
     - `web-no-infra-except-container`: from `^apps/web` with `pathNot: ^apps/web/src/container` to `^packages/infra`.
     - `web-no-domain`: from `^apps/web` to `^packages/domain` — **severity `warn` for now**; T4.1 turns it to `error`.
     - `packages-no-apps`: from `^packages` to `^apps`.
     - `no-circular`: `from: {}`, `to: { circular: true }`.
  4. Note: workspace packages resolve through `node_modules/@cashpilot/*` symlinks; if a rule on `^packages/...` paths does not trigger, also add the `node_modules/@cashpilot/<name>` form to the `to.path` regex. Prove each rule works by temporarily adding a forbidden import, running `pnpm depcruise`, seeing the error, then removing the import.
- **Done when:** `pnpm depcruise` finishes in < 30 s and reports **known violations** (`apps/web` → `@cashpilot/db`). Leave that violation for T3.6 — make the `only-infra-imports-db` rule exempt `^apps/web/src/container` **temporarily** with a `// TODO(T3.6)` comment.
- **Commit:** `chore(guardrails): make dependency-cruiser run on apps and packages`

#### T0.2 Shared ESLint config and lint in every package
- **Why:** s.43 — one config, all packages linted. Today only `apps/web` is linted.
- **Files:** `packages/config/eslint/base.js`, `packages/config/package.json`, each `packages/*/package.json`, new `packages/*/eslint.config.js`.
- **Steps:**
  1. Add devDependencies to `@cashpilot/config`: `eslint@^9`, `typescript-eslint@^8`, `@eslint/js@^9` (check latest compatible versions with `pnpm view`).
  2. `base.js` exports a flat config: `js.configs.recommended`, `...tseslint.configs.recommended`, rules `"@typescript-eslint/no-explicit-any": "error"`, `"no-console": "warn"`, `"@typescript-eslint/consistent-type-imports": "warn"`; ignores `dist`, `.turbo`, `coverage`.
  3. Each package under `packages/*` gets `eslint.config.js` = `import base from "@cashpilot/config/eslint/base.js"; export default base;` and script `"lint": "eslint src"`.
  4. Leave `apps/web` on its current `next/core-web-vitals` config (Next 15 + eslint 8). Do not migrate it now.
  5. Existing `any` in `packages/infra/src/mongo/repositories.ts` will fail lint: add `packages/infra/src/mongo/repositories.ts` to `ignores` **with a comment `// TODO(T3.2) remove`**. That is the only allowed ignore.
- **Done when:** `pnpm turbo run lint` lints all 7 workspaces and passes.
- **Commit:** `chore(config): shared eslint flat config and lint script in every package`

#### T0.3 CI runs on push and pull request
- **Files:** `.github/workflows/ci.yml`, `turbo.json`.
- **Steps:**
  1. `on: { push: { branches: [main] }, pull_request: {}, workflow_dispatch: {} }`.
  2. Steps: checkout (fetch-depth 0), pnpm setup, node 22 with pnpm cache, `pnpm install --frozen-lockfile`, `pnpm turbo run lint typecheck test build`, `pnpm depcruise`.
  3. CI has no `DATABASE_URL`: the app must build and tests must run against in-memory adapters (already the case). Set `env: { AUTH_SECRET: ci-secret, SKIP_ENV_VALIDATION: "true" }` at job level (used by T0.4).
  4. `turbo.json`: add `"globalEnv": ["NODE_ENV"]` and on `build`: `"env": ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "CLOUDINARY_URL", "DEMO_LOGIN"]` (s.46).
- **Done when:** workflow YAML is valid (`pnpm dlx @action-validator/cli .github/workflows/ci.yml` or careful review); local `pnpm turbo run lint typecheck test build` passes.
- **Commit:** `ci: run checks on push and pull requests, declare env for turbo cache`

#### T0.4 Typed env actually used
- **Why:** s.46 / P2-7.
- **Files:** `packages/config/src/env.ts`, `packages/config/src/index.ts`, `.env.example`.
- **Steps:**
  1. Replace the eager `export const env = envSchema.parse(process.env)` with `export function getServerEnv()` that parses once and caches; if `process.env.SKIP_ENV_VALIDATION === "true"` it uses `envSchema.partial().parse`.
  2. Make `DATABASE_URL` optional (in-memory mode when absent), keep the mongodb regex when present. Add `DEMO_LOGIN: z.enum(["true","false"]).default("false")`, `AUTH_SECRET` required in production (`superRefine` on `NODE_ENV`).
  3. `index.ts`: `export { getServerEnv } from "./env";` and the `ServerEnv` type.
  4. Add `DEMO_LOGIN=false` to `.env.example`, remove the unused `RESEND_API_KEY`, `AXIOM_*` lines (they are not used; README is fixed in T6.2).
- **Done when:** typecheck passes; `getServerEnv()` is called in T3.6 and T4.3 (not yet here).
- **Commit:** `feat(config): lazy typed server env with in-memory mode`

#### T0.5 Delete the personal DB check script
- **Files:** delete `packages/db/scripts/check.mjs` (contains a personal e-mail, reads `.env` by relative path).
- **Commit:** `chore(db): remove ad-hoc check script`

---

### Phase 1 — Domain (pure rules + unit tests). Add a `*.test.ts` next to every file you touch.

> Every domain test file lives in `packages/domain/src/**`, uses `vitest`, no mocks, no I/O. Remove `--passWithNoTests` from `packages/domain/package.json` at the end of T1.1.

#### T1.1 Typed errors everywhere + new codes
- **Files:** `packages/domain/src/errors/codes.ts`, all value objects.
- **Steps:**
  1. Add codes: `INVALID_INPUT`, `INVALID_DATE`, `INVALID_EMAIL`, `INVALID_ID`, `PARTY_NOT_FOUND`, `SCENARIO_NOT_FOUND`, `RETAINER_NOT_FOUND`, `MEMBERSHIP_NOT_FOUND`, `LAST_OWNER`, `OPENING_BALANCE_ALREADY_SET`, `CONCURRENT_UPDATE`.
  2. Export a type `DomainErrorCode = keyof typeof DOMAIN_ERROR_CODES`; `DomainError.code` is typed `DomainErrorCode`.
  3. `DateOnly.from` → `DomainError(INVALID_DATE)`; also reject impossible dates like `2026-02-31` (compare the ISO string back after parsing). `Email.from` → `INVALID_EMAIL`. `InvoiceNumber.from` → `INVALID_INPUT`. Id `from("")` → `INVALID_ID` (non-empty, trimmed; keep accepting non-UUID ids because seed uses `invoice-001`).
  4. **Delete `DateOnly.today()`** (hidden time, P1-11). Add `DateOnly.fromDate(date: Date)` (UTC `YYYY-MM-DD`) for the Clock adapter, and `daysUntil(other): number`.
  5. Tests: `date-only.test.ts`, `email.test.ts`, `ids.test.ts`.
- **Done when:** no `throw new Error(` remains in `packages/domain/src` (`grep -rn "new Error(" packages/domain/src` is empty).
- **Commit:** `feat(domain): typed error codes in value objects, remove hidden clock`

#### T1.2 Signed Money (fixes P0-1)
- **Files:** `value-objects/money.ts`, `money.test.ts`.
- **API (exact):**
  ```ts
  class Money {
    static of(amount: number, currency = "DNT"): Money        // any safe integer, may be negative
    static positive(amount: number, currency = "DNT"): Money  // INVALID_MONEY_AMOUNT unless integer > 0
    static zero(currency = "DNT"): Money
    add(o: Money): Money; subtract(o: Money): Money           // never throw for sign
    multiply(quantity: number): Money                         // quantity must be a positive integer, else INVALID_INPUT
    negate(): Money
    isZero(): boolean; isNegative(): boolean; isPositive(): boolean
    isGreaterThan(o: Money): boolean; equals(o: Money): boolean
  }
  ```
  Non-integer or non-safe-integer → `INVALID_MONEY_AMOUNT`. Currency mismatch → `CURRENCY_MISMATCH` (DomainError).
- **Tests:** add/subtract crossing zero; `positive(0)` and `positive(-1)` throw; `of(1.5)` throws; `multiply(3)`; currency mismatch.
- **Then fix every caller** that relied on `Money.of` rejecting negatives: invoice line prices, payment amounts, expense amounts, retainer amounts → `Money.positive`. Typecheck will not catch this — `grep -rn "Money.of(" packages` and decide each one.
- **Commit:** `fix(domain): signed Money so forecasts can go negative`

#### T1.3 Access policy (D3, fixes P0-4 in the domain)
- **Files:** new `packages/domain/src/access/permissions.ts`, `access/index.ts`, `access/permissions.test.ts`; export from domain `index.ts`.
- **Content:**
  - `type Permission = "dashboard.view" | "cash.view" | "cash.adjust" | "company.manage" | "members.manage" | "parties.view" | "parties.manage" | "invoices.view" | "invoices.manage" | "invoices.export" | "payments.record" | "expenses.submit" | "expenses.viewAll" | "expenses.decide" | "expenses.pay" | "forecast.view" | "simulations.use" | "retainers.manage" | "audit.view"`.
  - `const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]>` exactly from `UNDERSTANDING.md` §3 (owner: everything except `invoices.manage`, `payments.record`, `expenses.pay`, `parties.manage`, `retainers.manage`; finance_manager: everything except `company.manage`, `members.manage`, `expenses.decide`; collaborator: `expenses.submit` only). **Show the final table to the user in the task summary** so the team can validate it.
  - `function can(role, permission): boolean` and `function assertCan(role, permission): void` (throws `ACCESS_DENIED`).
  - Add method `Membership.can(permission)`.
- **Tests:** one test per row of the matrix (table-driven `it.each`).
- **Commit:** `feat(domain): role permission policy from the access matrix`

#### T1.4 Invoice rules
- **Files:** `entities/invoice.ts`, `invoice.test.ts`.
- **Steps:**
  1. `InvoiceLine` built inside the entity: input lines are `{ description, quantity, unitPrice: Money }`; `lineTotal = unitPrice.multiply(quantity)` computed by the entity (callers no longer pass `lineTotal`).
  2. `create()` invariants: ≥ 1 line; description non-empty; quantity positive integer; `dueDate` not before `issueDate`; total > 0. Errors `INVALID_INPUT`.
  3. `reviseDraft(changes)` — only in `draft` (else `INVALID_TRANSITION`), re-applies the same invariants, recomputes total/remaining. Replaces the `Invoice.create` hack in `UpdateInvoiceDraft`.
  4. `cancel({ hasPayments, by: UserId, on: DateOnly, reason: string })` — stores `cancelledBy/At/Reason`; reason required (non-empty). Keep: payments → `INVOICE_HAS_PAYMENTS`; only `draft`/`validated` can be cancelled (`partially_paid` always has payments).
  5. `applyPayment(amount)`: `Paid` → `INVOICE_ALREADY_PAID` (before the generic not-payable check); amount must be positive.
  6. `isOverdue(today: DateOnly): boolean` (BR-05) and `expectedReceipt(): { invoiceId, dueDate, amount } | null` (only validated/partially_paid with remaining > 0) (D7).
  7. `snapshot()` includes `cancelledBy`, `cancelledAt`.
- **Tests:** every transition in BR-04 (allowed + forbidden), BR-06, BR-07, BR-09, BR-11, BR-12, partial payment reduces remaining (spec "critère 1"), overpay rejected (critère 2), isOverdue, expectedReceipt for each status.
- **Commit:** `feat(domain): invoice invariants, draft revision, overdue and expected receipt`

#### T1.5 Expense rules
- **Files:** `entities/expense.ts`, `expense.test.ts`.
- **Steps:** `create()` invariants (category/description non-empty, amount positive); `revise(changes, by: UserId)` only when `submitted` and only by the submitter or a role with `expenses.pay` (pass `canEditOthers: boolean`); `attachReceipt(fileId)` (only `submitted` or `approved`); `refuse(by, on, reason)` reason required; `markPaid(by, on)` — **no amount argument**, pays exactly `amount` (P2-8); `refused` → `REFUSED_EXPENSE_CANNOT_BE_PAID`; `paid` → `EXPENSE_ALREADY_PAID`; other non-approved → `EXPENSE_NOT_APPROVED`. Add `plannedDisbursement(): { expenseId, date, amount } | null` (approved only, per decision 10 in UNDERSTANDING §15).
- **Tests:** BR-13…BR-16, spec critère 3 ("une dépense refusée ne peut pas être payée").
- **Commit:** `feat(domain): expense lifecycle rules, receipt and planned disbursement`

#### T1.6 Cash movements and balance (D2, fixes P0-2 in the domain)
- **Files:** `entities/cash-movement.ts`, `entities/company.ts`, `services/cash-balance-calculator.ts`, tests.
- **Steps:**
  1. `CashMovement` id becomes a `CashMovementId` value object (add to `ids.ts`); amount becomes `Money` (signed). Factories with intent instead of a free `type` string: `CashMovement.opening(...)` (amount ≥ 0), `.fromInvoicePayment(payment)` (+amount), `.fromExpensePayment(expense)` (−amount), `.adjustment({..., reason})` (non-zero, reason required), `.reversal(original, reason)` (−original amount, links `reversesId`). Remove `CashMovement.create`. All take `id`, `actorId`, `date` explicitly.
  2. `Company`: **remove `openingBalance`**. Keep `name`, `sector`, `forecastThreshold`. Add `rename(name)`, `changeSector(sector)`, `setForecastThreshold(money)` with non-empty checks.
  3. `CashBalanceCalculator.balanceAt(movements: CashMovement[], date: DateOnly): Money` — sums movements with `date <= date`. Remove the `calculate(openingBalanceMillimes, number[])` method.
- **Tests:** BR-17 (balance after several operations = spec V2 demo), movement on the reference date included, future movement excluded, adjustment requires reason.
- **Commit:** `feat(domain): opening balance as a cash movement, intent-based movement factories`

#### T1.7 Forecast + scenario engines (fixes P0-1, P0-6 in the domain)
- **Files:** `services/forecast-engine.ts`, `services/scenario-engine.ts`, `entities/scenario.ts`, tests.
- **Steps:**
  1. `ForecastInputs = { referenceDate: DateOnly; referenceBalance: Money; receipts: ExpectedReceipt[]; disbursements: PlannedDisbursement[] }` with `ExpectedReceipt = { sourceId: string; label: string; date: DateOnly; amount: Money }`, same shape for disbursements.
  2. `function buildForecastInputs({ referenceDate, movements, invoices, expenses }): ForecastInputs` — uses `CashBalanceCalculator.balanceAt`, `invoice.expectedReceipt()`, `expense.plannedDisbursement()`. **The only place these rules exist** (P1-7).
  3. `ForecastEngine.balanceAt(inputs, target): Money` and `ForecastEngine.dailySeries(inputs, days: number): { date: DateOnly; balance: Money }[]` (day 0 … day N inclusive) and `ForecastEngine.horizons(inputs)` → ref, +30, +60, +90.
  4. `findShortageWindows(series) → { start, end, minimum: Money, minimumDate }[]` (consecutive negative days).
  5. `Hypothesis` becomes a **discriminated union**: `{ type: "client_delay"; invoiceId: string; delayDays: number } | { type: "new_expense"; amount: Money; date: DateOnly; label: string } | { type: "extra_income"; amount: Money; date: DateOnly; label: string }`. Validation inside `Scenario.addHypothesis` (`delayDays` integer 1..365, amounts positive) → `SCENARIO_HYPOTHESIS_INVALID`. Add `Scenario.removeHypothesis(index)`.
  6. `ScenarioEngine.apply(inputs, hypotheses): ForecastInputs` — returns **new arrays** (never mutates the input); client delay matches `receipt.sourceId === invoiceId`; unknown invoice → `SCENARIO_HYPOTHESIS_INVALID`. One small strategy object per hypothesis type in a `Record<type, applyFn>` (OCP skill: no if/else chain).
  7. `AlertEvaluator.evaluate({ today, invoices, expenses, series, threshold }) → Alert[]` with `Alert = { type: "invoice_overdue" | "expense_pending" | "forecast_negative" | "forecast_below_threshold"; entityType; entityId; message; date? }`. One evaluator function per alert type registered in an array (OCP).
- **Tests (use the exact numbers from UNDERSTANDING.md §5):** Example A table, Example B table + shortage window 15 Nov → 29 Nov min −1 000 DT, partial-payment variant, overdue variant, cancelled invoice excluded, refused/paid expense excluded, `ScenarioEngine.apply` does not mutate its input (spec critère "une simulation ne modifie jamais les données réelles"), two invoices with the same due date → only the right one is delayed.
- **Commit:** `feat(domain): forecast inputs, daily series, shortage windows, typed hypotheses`

#### T1.8 Remaining entities: Party, Retainer, Membership, User
- **Steps:**
  - `Party.create` name non-empty, optional email validated via `Email`; `Party.update(changes)` method.
  - `Retainer.create`: amount positive, `intervalDays` integer 1..366; `pause()` only when active, `resume()` only when paused (else `INVALID_TRANSITION`); `update(changes)`; `generateDueInvoices(asOf, nextNumber: () => InvoiceNumber, today)` stays in the use case — but add `Retainer.dueDates(asOf): DateOnly[]` (pure) and `advance()`.
  - `Membership.changeRole(role)`; static `assertNotLastOwner(memberships, userId)` → `LAST_OWNER` (P2-3).
  - `User`: keep; no change.
- **Tests:** each new rule.
- **Commit:** `feat(domain): party, retainer and membership behaviours`

---

### Phase 2 — Application layer

#### T2.1 Authorization helper and actor input
- **Files:** new `packages/application/src/access/authorize.ts`, `access/index.ts`.
- **Steps:**
  1. `type ActorInput = { userId: string; companyId: string }`.
  2. `async function authorize(memberships: MembershipRepository, actor: ActorInput, permission: Permission): Promise<Membership>` — loads the membership, throws `ACCESS_DENIED` if missing, calls `membership.can`/`assertCan`. Returns the membership (role needed by some use cases).
  3. Rename every input field `actorUserId` → `userId` (ApproveExpense, RefuseExpense, InviteMember, ChangeMemberRole, RemoveMember) so all use cases share `ActorInput`.
  4. Re-export `DomainError`, `DOMAIN_ERROR_CODES`, `DomainErrorCode` from `packages/application/src/errors.ts` and the package index (D12).
- **Commit:** `feat(application): single authorize helper based on the domain policy`

#### T2.2 Apply permissions to every use case (fixes P0-4)
- **Steps:** in each use case replace the `byUserAndCompany` + `if (!membership)` block with `await authorize(this.memberships, input, "<permission>")`. Mapping:

  | Use case | Permission |
  |---|---|
  | GetCompany | (membership only — any role) use `authorize` with no permission → add overload `authorizeMember` |
  | UpdateCompany | `company.manage` |
  | InviteMember / ChangeMemberRole / RemoveMember / ListMembers(new) | `members.manage` (ListMembers: any member) |
  | CreateParty / UpdateParty | `parties.manage` |
  | ListParties / GetPartyHistory | `parties.view` |
  | CreateInvoiceDraft / UpdateInvoiceDraft / ValidateInvoice / CancelInvoice | `invoices.manage` |
  | GetInvoice / ListInvoices / ListPaymentsForInvoice | `invoices.view` |
  | ExportInvoicePdf | `invoices.export` |
  | RecordPayment | `payments.record` |
  | SubmitExpense / AttachReceipt / GetExpense (own) | `expenses.submit` |
  | ListExpenses | `expenses.viewAll` → all; otherwise only `submittedBy === userId` |
  | GetExpense (someone else's) | `expenses.viewAll` |
  | ApproveExpense / RefuseExpense | `expenses.decide` |
  | MarkExpensePaid | `expenses.pay` |
  | GetRealBalance / ListCashMovements | `cash.view` |
  | SetOpeningBalance / RecordAdjustment | `cash.adjust` |
  | GetForecast / GetForecastSeries / GetDashboard / ListAlerts | `forecast.view` / `dashboard.view` |
  | Scenario use cases | `simulations.use` |
  | Retainer use cases | `retainers.manage` |
- **Tests:** in each `*.use-cases.test.ts` add one "collaborator gets ACCESS_DENIED and nothing is saved" test per mutating use case (assert repositories unchanged).
- **Commit:** `fix(application): enforce role permissions in every use case`

#### T2.3 Ports cleanup (D4, D5, D6, P1-9, P1-10)
- **Files:** `packages/application/src/ports/*`.
- **Steps:**
  1. Delete `transaction-manager.ts` port.
  2. New port `financial-ledger.ts`:
     ```ts
     interface FinancialLedger {
       recordInvoicePayment(input: { invoice: Invoice; expectedPreviousRemaining: Money; payment: Payment; movement: CashMovement }): Promise<void>;
       recordExpensePayment(input: { expense: Expense; movement: CashMovement }): Promise<void>;
       recordMovement(movement: CashMovement): Promise<void>;
     }
     ```
     Contract (write it as a doc comment): all-or-nothing; throws `CONCURRENT_UPDATE` if the stored invoice remaining ≠ `expectedPreviousRemaining`; throws `DUPLICATE_OPERATION` if the payment/movement id already exists.
  3. `CashMovementRepository`: keep only reads (`byCompany`, `openingFor(companyId)`); writes go through `FinancialLedger`.
  4. `PaymentRepository`: remove `save` (ledger writes payments).
  5. `InvoiceRepository.nextNumber(companyId): Promise<InvoiceNumber>` (atomic, D6).
  6. `PdfExporter.exportInvoice(data: InvoicePdfData): Promise<Uint8Array>` with `InvoicePdfData = { company: { name }, customer: { name, email?, address? }, invoice: InvoiceSnapshot, payments: PaymentSnapshot[] }` (D14).
  7. `AuditLogRepository.append(entry: AuditLogEntry)` (rename `save`), entry gets `at: string` (ISO from Clock) and `action` typed as a union (`"invoice.validated" | "invoice.cancelled" | "payment.recorded" | "expense.approved" | "expense.refused" | "expense.paid" | "cash.adjusted" | "cash.opening_set" | "member.invited" | "member.role_changed" | "member.removed" | "company.updated"`).
  8. Delete unused `IdentityProvider` and `SessionReader` ports (replaced by T2.7 use cases). Keep `IdGenerator`, `Clock`, `Logger`, `FileStorage`.
- **Commit:** `refactor(application): ledger port for atomic money writes, typed audit, pdf data port`

#### T2.4 Rewrite money use cases on the new domain
- **Files:** `invoices/record-payment.ts`, `expenses/mark-expense-paid.ts`, `cash/*`, `company/register-company.ts`, `company/update-company.ts`.
- **Steps:**
  1. `RecordPayment(invoices, ledger, memberships, audit, ids, clock)`: input gets `operationId` (used as `PaymentId`, D5). Flow: authorize → load invoice (company check → `INVOICE_NOT_FOUND`) → remember `previous = invoice.remaining` → `invoice.applyPayment(Money.positive(...))` → `Payment.create` → `CashMovement.fromInvoicePayment` (id from `ids.newId()`) → `ledger.recordInvoicePayment(...)` → `audit.append`. Payment date must not be in the future (`clock.today()`), else `INVALID_DATE`.
  2. `MarkExpensePaid(expenses, ledger, memberships, audit, ids, clock)`: no amount input; date from input but ≤ today.
  3. `RegisterCompany(companies, memberships, ledger, ids, clock)`: creates company, owner membership, **opening movement** (D2). Input: `{ userId, name, sector, openingBalanceMillimes, openingDate }`.
  4. `SetOpeningBalance`: allowed only if no opening movement exists (`OPENING_BALANCE_ALREADY_SET`), else UI uses adjustment (P0-8).
  5. `RecordAdjustment(ledger, memberships, audit, ids, clock)`: amount non-zero, reason required, date ≤ today.
  6. `UpdateCompany`: name/sector/threshold only via entity methods; **no opening balance field**.
  7. `GetRealBalance`: `CashBalanceCalculator.balanceAt(movements, clock.today())`.
  8. Replace every `crypto.randomUUID()` in application with `this.ids.newId()`.
- **Tests:** spec critères 1, 2, 4 (operation affects real balance once), 9 (no rounding: 3 payments of 1 000.333 DT); duplicate `operationId` → `DUPLICATE_OPERATION` (fake ledger must implement the contract); defense scenario steps 1–4 as one test.
- **Commit:** `fix(application): atomic payments via ledger, opening balance as movement, traceable adjustments`

#### T2.5 Forecast, alerts, dashboard, simulation on one source of rules
- **Files:** `forecast/*`, `alerts/*`, `simulation/*`.
- **Steps:**
  1. New internal class `ForecastContextLoader(companies, invoices, expenses, movements)` in `forecast/forecast-context-loader.ts` with `load(companyId, referenceDate): Promise<ForecastInputs>` calling `buildForecastInputs`. **Not exported** from the package index.
  2. `GetForecast(loader, memberships, clock)` → returns `{ referenceDate, referenceBalanceMillimes, horizons: [...], series: [...] (91 days), shortageWindows }`. `GetForecastSeries` is deleted (the series is now in `GetForecast`); update its callers.
  3. `ListAlerts(loader, invoices, expenses, companies, memberships, clock)` → `AlertEvaluator.evaluate`. It must not call another use case's `execute` (that re-checks permissions and reloads everything).
  4. `GetDashboard` composes loader + evaluator directly; returns real balance, horizons, alerts, counts.
  5. `RunSimulation(scenarios, loader, memberships, clock)`: reference date = `scenario.baseReferenceDate`; `base = loader.load(...)`; `simulated = ScenarioEngine.apply(base, scenario.hypotheses)`; returns horizons for both, daily series for both, `deltas`, `shortageWindows` for both, and `hypotheses` with a human label each. Does **not** call any save (critère "simulation ne modifie jamais").
  6. `CompareScenarios` gets `RunSimulation` injected through its constructor (wired in the container) instead of `new RunSimulation(...)` inside.
  7. `CreateScenario` uses `clock.today()` as default reference date. `AddHypothesis` input becomes the discriminated union in primitive form (`amountMillimes`, `date` strings) mapped to the domain union inside the use case. Remove `as any`.
- **Tests:** Example B end-to-end through `RunSimulation` with fakes: base never negative, simulated shortage window 15→29 Nov at −1 000 DT; assert invoice/expense/payment fakes unchanged after the run.
- **Commit:** `refactor(application): single forecast loader, daily series and shortage windows in simulation`

#### T2.6 Non-money use cases use behaviour methods (P1-6) + audit
- **Steps:** `UpdateInvoiceDraft` → `invoice.reviseDraft`; `CreateInvoiceDraft` → number from `invoices.nextNumber` (no `number` input), check that `customerId` is a **customer of the same company** (`PARTY_NOT_FOUND`); `CancelInvoice` → `cancel({ ..., reason })` + audit; `ValidateInvoice` + audit; `UpdateParty` → `party.update`; `UpdateRetainer`/`Pause`/`Resume` → entity methods; `UpdateSubmittedExpense` → `expense.revise`; `AttachReceipt` → upload then `expense.attachReceipt(file.id)` (delete the `await import` hack); validate content type/size (D15) → `INVALID_INPUT`; `ApproveExpense`/`RefuseExpense` decision date from `clock.today()` (no input date) + audit; `ChangeMemberRole`/`RemoveMember` check `LAST_OWNER` + audit; `InviteMember` input by **email** (`users.byEmail`, `USER_NOT_FOUND` if that person never signed in) + audit; new `ListMembers` (returns `{ userId, name, email, role }[]`); `GenerateRetainerInvoices` needs `retainers.manage`, uses `nextNumber`, `clock.today()` default. Fix wrong error codes (P1-8). `ExportInvoicePdf` builds `InvoicePdfData` (loads company, customer, payments) and calls the exporter.
- **Tests:** one test per changed rule (customer of another company rejected, last owner protected, invite by unknown email).
- **Commit:** `refactor(application): behaviour methods instead of entity rebuilds, audit trail`

#### T2.7 Session / onboarding use cases (fixes P0-5, P1-2)
- **Files:** new `packages/application/src/access/resolve-actor.ts`, `access/list-my-companies.ts`.
- **Steps:**
  1. `ResolveActor(users, memberships, ids)`: input `{ email, name, provider, subject, preferredCompanyId?: string }` → finds or creates the `User` (by email); loads `memberships.listByUser`; picks `preferredCompanyId` **only if a membership exists for it**, else the first; returns `{ userId, name, email, companyId: string | null, role: MembershipRole | null }`. **Never creates a membership.**
  2. `ListMyCompanies(memberships, companies)` → `{ companyId, name, role }[]` for the company switcher.
  3. `RegisterCompany` (T2.4) is the onboarding use case.
- **Tests:** new user gets `companyId: null`; preferred company without membership is ignored (tenant isolation, critère 7).
- **Commit:** `feat(application): resolve signed-in actor without implicit memberships`

---

### Phase 3 — Infrastructure

#### T3.1 Mongo schemas match the domain
- **Files:** `packages/db/src/schemas.ts`.
- **Steps:** remove `openingBalanceMillimes` from company; cash movement gets `reversesId?`; invoice gets `cancelledBy`, `cancelledAt`; add `counters` model `{ _id: "<companyId>:invoice", seq: number }`; scenario hypotheses stored as typed subdocuments (`type`, `invoiceId?`, `delayDays?`, `amountMillimes?`, `date?`, `label?`); payment and cash-movement models get `timestamps` and **no update path**; add `optimisticConcurrency`-friendly field `version: Number` on invoices. Export TypeScript doc types (`CompanyDoc`, `InvoiceDoc`, …) via `InferSchemaType`.
- **Commit:** `refactor(db): schemas aligned with the domain, typed documents, invoice counter`

#### T3.2 Mappers and typed repositories (P1-5)
- **Files:** split `packages/infra/src/mongo/repositories.ts` into one file per repository under `packages/infra/src/mongo/` and one mapper per aggregate under `packages/infra/src/mongo/mappers/` (`invoice-mapper.ts` with `toDomain(doc: InvoiceDoc): Invoice` and `toPersistence(invoice: Invoice): InvoiceDoc`, etc.). Delete `packages/infra/src/mappers/index.ts`.
- **Steps:** no `any`; replace `saveById` with `Model.replaceOne({ _id }, doc, { upsert: true })` for mutable aggregates; every repository method first `await connectDb()` (lazy connection, so the web app never calls `connectDb` — prepares T3.6); `byId` queries also filter `companyId` when the port gives one. Remove the TODO ignore from T0.2.
- **Commit:** `refactor(infra): typed mongo repositories with explicit mappers`

#### T3.3 Mongo financial ledger (D4, D5 — fixes P0-7)
- **Files:** `packages/infra/src/mongo/mongo-financial-ledger.ts`, `packages/infra/src/in-memory/in-memory-financial-ledger.ts`.
- **Steps:** Mongo: `const session = await mongoose.startSession(); await session.withTransaction(async () => { invoice update with filter { _id, remainingMillimes: expectedPrevious } (modifiedCount 0 → throw CONCURRENT_UPDATE); PaymentModel.create([doc], { session }); CashMovementModel.create([doc], { session }); })`; map Mongo duplicate key error `11000` → `DUPLICATE_OPERATION`. In-memory: same contract with Maps (check id existence and previous remaining before writing anything). Delete `NoopTransactionManager`.
- **Commit:** `feat(infra): transactional ledger for payments and cash movements`

#### T3.4 Invoice number counter
- `MongoInvoiceRepository.nextNumber`: `CounterModel.findOneAndUpdate({ _id }, { $inc: { seq: 1 } }, { upsert: true, new: true })` → `INV-` + seq padded to 4. In-memory: Map counter.
- **Commit:** `feat(infra): atomic per-company invoice numbering`

#### T3.5 Real adapters: PDF, file storage, logger, clock, ids
- **Steps:** `PdfLibInvoiceExporter` (`pdf-lib`, A4, company name, invoice number, dates, lines, total, paid, remaining — money formatted with a small pure function in infra, not imported from web); `CloudinaryFileStorage` (signed upload via Cloudinary REST with `fetch`, or the `cloudinary` SDK — pick the SDK, server only); `JsonLogger` (one JSON line per call with `level`, `message`, `time`, context; Vercel collects stdout); `SystemClock.today()` → `DateOnly.fromDate(new Date())`; keep `CryptoIdGenerator`. Keep in-memory versions for tests/demo.
- **Commit:** `feat(infra): pdf export, cloudinary receipts, json logger`

#### T3.6 Composition root cleanup (P1-1, P1-3, P1-4)
- **Files:** `apps/web/src/container/index.ts`, `apps/web/package.json`, `packages/infra/src/index.ts`, new `packages/infra/src/seed/demo-seed.ts`, `packages/infra/scripts/seed.ts`.
- **Steps:**
  1. Infra exports two factories: `createMongoAdapters()` and `createInMemoryAdapters()`, each returning `{ repositories, ledger, fileStorage, pdfExporter }`.
  2. Move the seed into `packages/infra/src/seed/demo-seed.ts` as `seedDemo(adapters, clock)` — idempotent (skip if company exists), dates **relative to `clock.today()`** (per `docs/SEED.md`), opening balance as an opening movement only (fixes P0-2 data), payments/movements through the ledger. Reproduce the spec example: 5 000 DT, invoice 3 000 DT due in 9 days, approved expense 6 000 DT in 14 days, plus the existing demo rows.
  3. `packages/infra/scripts/seed.ts` + script `"seed": "tsx scripts/seed.ts"` (add `tsx` devDependency) that loads `.env` via `node --env-file`.
  4. Container: chooses factory by `getServerEnv().DATABASE_URL`; in-memory mode calls `seedDemo` once at module load. Builds each use case **once** (shared `ForecastContextLoader`, `RunSimulation` injected into `CompareScenarios`). Exports **only** `useCases` (no repositories, no `demo`, no `ensureDb`).
  5. `apps/web/package.json`: remove `@cashpilot/db` and `@cashpilot/domain`; move `@cashpilot/infra` to `dependencies`. Remove the T0.1 temporary exemption so `only-infra-imports-db` applies to `apps/web/src/container` too.
- **Done when:** `pnpm depcruise` shows no `apps/web → packages/db` edge; container file < 120 lines.
- **Commit:** `refactor(web): composition root wires use cases only, seed moved to infra script`

#### T3.7 Infra integration tests
- **Steps:** devDependency `mongodb-memory-server` (Mongo equivalent of the course's Testcontainers, s.51) in infra; start a **replica set** (`MongoMemoryReplSet`) so transactions work; tests: invoice save/load round-trip, ledger payment is atomic (force failure on movement insert → invoice and payment unchanged), duplicate payment id → `DUPLICATE_OPERATION`, concurrent payment → `CONCURRENT_UPDATE`, counter gives unique numbers under `Promise.all` of 10 calls, `byCompany` never returns another company's rows. Remove `--passWithNoTests` from infra.
- **Commit:** `test(infra): mongo integration tests on an in-memory replica set`

---

### Phase 4 — Presentation (`apps/web`)

#### T4.1 Thin pages: only use cases (P1-2)
- **Steps:** `(app)/layout.tsx` → `useCases.getCompany` + `useCases.listMyCompanies`; `settings/members/page.tsx` → `useCases.listMembers`; remove every `@cashpilot/domain` import from `apps/web` (use `@cashpilot/application` re-exports for errors); turn depcruise `web-no-domain` to `error`. Move the overdue rule out of `invoices/page.tsx`: `ListInvoices` returns `overdue: boolean` per invoice (computed with `invoice.isOverdue(clock.today())`) and accepts `filter: "overdue" | status`.
- **Commit:** `refactor(web): pages call use cases only`

#### T4.2 Actor from session + active company (D9, fixes P0-3, P0-5)
- **Files:** `apps/web/src/lib/auth-actor.ts` (rename to `lib/session.ts`), `app/actions.ts`.
- **Steps:** `getActor()` → `auth()` → `useCases.resolveActor.execute({ ..., preferredCompanyId: cookies().get("cp_company")?.value })`; `requireActor()` redirects to `/login` without session and to `/onboarding` when `companyId === null`; `requireActorWith(permission)` redirects to `/forbidden` page if the role lacks it (UX only — the use case still checks). **Delete every use of `demo.companyId` / `demo.ownerUserId`**; actions use `actor.companyId`. Add a `switchCompanyAction(companyId)` that sets the cookie only after `listMyCompanies` confirms membership.
- **Done when:** `grep -rn "demo\." apps/web/src` returns nothing.
- **Commit:** `fix(web): actions use the signed-in user's active company`

#### T4.3 Onboarding and demo login (D9, D10 — confirm D10 with the user first)
- **Steps:** page `/onboarding` with a form (company name, sector select: digital agency/training center/shop/services, opening balance in DNT, opening date) → `registerCompanyAction` → cookie → redirect `/dashboard`. Auth.js: add Credentials provider `demo` only when `getServerEnv().DEMO_LOGIN === "true"`, authorizing only the three seeded e-mails; login page shows three "Demo: Owner / Finance / Collaborator" buttons when enabled. Session `maxAge: 8 * 60 * 60`, `updateAge: 60 * 60` (P2-5). Remove `as any` exports in `auth.ts` (type them with `NextAuthResult`). Add `/onboarding` to the middleware matcher.
- **Commit:** `feat(web): onboarding to create a company and env-gated demo login`

#### T4.4 Server actions: per-feature files, Zod schemas, error results (s.31, s.32, P2-2)
- **Files:** split `app/actions.ts` into `app/(app)/<feature>/actions.ts` + `app/(app)/<feature>/schemas.ts` (invoices, expenses, cash, parties, simulations, retainers, settings). New `lib/action-result.ts`, `lib/error-messages.ts`, `lib/money-input.ts`.
- **Steps:**
  1. `type ActionResult = { ok: true; message?: string } | { ok: false; fieldErrors?: Record<string, string[]>; message: string }`.
  2. Each action: `requireActor()` → `schema.safeParse` → on failure return `{ ok: false, fieldErrors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." }` → `try { await useCases.x.execute(...) } catch (e) { if (e instanceof DomainError) return { ok: false, message: errorMessage(e.code) }; throw e; }` → `revalidatePath` → `{ ok: true }`.
  3. `errorMessage(code)`: one English sentence per `DomainErrorCode` (exhaustive `Record<DomainErrorCode, string>` so TypeScript forces new codes to get a message).
  4. `parseDntToMillimes("2000.5") → 2000500` pure string parsing (max 3 decimals, optional thousands separators removed, negative only where allowed); Zod uses `.transform`. Unit-test it in `apps/web/src/lib/money-input.test.ts`.
  5. `addHypothesisAction`: `z.discriminatedUnion("type", [...])`.
  6. Payment form: hidden `operationId` generated in the **server** page (`crypto.randomUUID()`) (D5).
- **Commit:** `feat(web): per-feature server actions with zod schemas and user-facing errors`

#### T4.5 Forms as small client leaves
- **Steps:** create `components/forms/action-form.tsx` (`"use client"`, `useActionState`, shows `message` and per-field errors, disables submit while pending). Every form page stays a Server Component that renders this leaf. All inputs get a `<label>`. Invoice form customer `<select>` comes from `useCases.listParties({ type: "customer" })`; no invoice number field (D6); amounts in DNT. Cancel invoice asks for a reason; refuse expense asks for a reason. Expense form uses `<input type="file" accept="image/*,application/pdf">` → `AttachReceipt`.
- **Commit:** `feat(web): accessible client form leaves with validation feedback`

#### T4.6 Wire the fake screens (P3-3)
- **Steps:** company settings form → `updateCompanyAction` (name, sector, forecast threshold), prefilled from `getCompany`; members page → invite by e-mail form, role `<select>` + "Save" per member, "Remove" with confirmation; buttons rendered only when `can(role, "members.manage")` (use a tiny `permissions` DTO returned by `resolveActor`, not the domain import).
- **Commit:** `feat(web): working company settings and member management`

#### T4.7 Role-aware navigation, loading/error/empty states (P3-6, P3-7)
- **Steps:** `nav-sidebar` receives `permissions` and hides links the role cannot use (collaborator: Expenses only); add `app/(app)/loading.tsx` and `app/(app)/error.tsx`; every list page has an empty state with a call to action; `/forbidden` page.
- **Commit:** `feat(web): role-aware navigation and loading, error, empty states`

#### T4.8 Forecast and simulation screens show the shortage
- **Steps:** forecast page uses `GetForecast` daily series for the chart and horizons for the 4 tiles; shows shortage chips "−1,000.000 DNT on 15 Nov" from `shortageWindows`; simulation detail shows base (solid) vs simulated (dashed), deltas table, hypothesis list with labels and a remove button; dashboard shows real balance, 30/60/90, alerts list with links to the entity.
- **Commit:** `feat(web): forecast and simulation show daily series and shortage windows`

#### T4.9 Shared UI package and one money formatter (P3-9)
- **Steps:** move repeated pieces into `packages/ui/src/`: `Button`, `Card` (glass), `Field` (label + input + error), `StatusChip`, `MoneyText` (takes already-formatted text), `PageHeader`, `EmptyState`. Export each from `packages/ui/src/index.ts`. Replace inline style blocks in pages with these components / CSS classes in `globals.css`. Delete the per-page `formatDnt` copies; use `lib/format.ts` everywhere (English `2,000.500 DNT`, handles negatives `−1,000.000 DNT`).
- **Do this last in Phase 4**: it is cosmetic and touches many files. Commit per page group if large.
- **Commit:** `refactor(ui): shared presentational components and single money formatter`

---

### Phase 5 — Tests that prove the spec (grading: "Exactitude des calculs", "Permissions et traçabilité")

#### T5.1 Validation-criteria matrix
- Create `docs/TEST-MATRIX.md`: a table with every **critère de validation** from `docs/PROJECT.md` §4 and every BR-xx from `UNDERSTANDING.md` §4 → the test file + test name that proves it (lowest layer possible). Any row without a test → write the test now.
- **Commit:** `test: map every validation criterion to an automated test`

#### T5.2 E2E critical journeys (3–10, s.52)
- **Setup:** Playwright `webServer` runs `pnpm dev` with `DEMO_LOGIN=true` and **no** `DATABASE_URL` (in-memory adapters + seed). Use `getByRole`/`getByLabel` only.
- **Journeys:**
  1. Defense scenario (owner + finance): create company with opening balance → create customer → create & validate invoice → record partial payment → remaining is correct → collaborator submits expense → owner approves → finance marks paid → forecast shows values → create scenario with 20-day delay → comparison shows shortage.
  2. Collaborator cannot open `/invoices` (forbidden page) and sees only own expenses.
  3. Overpayment shows the "exceeds remaining" message and nothing changes.
  4. Refused expense has no "Mark paid" action and the server rejects a forged submit.
  5. Double-click on "Record payment" records a single payment.
- Delete `e2e/google.signin.spec.ts` (depends on Google's real site; flaky in CI). Keep `login.spec.ts`.
- **Commit:** `test(e2e): defense scenario and permission journeys`

---

### Phase 6 — Documentation & delivery

#### T6.1 Real ARCHITECTURE.md (course deliverable, D16)
- **Steps:** `git mv docs/ARCHITECTURE.md docs/reference/COURSE-ARCHITECTURE.md`; update `AGENTS.md` read order and step 0 of `.opencode/skills/clean-nextjs-monorepo/SKILL.md` to point to the new path; write a new `docs/ARCHITECTURE.md` (≤ 250 lines): layers & package graph (mermaid), dependency rule + how depcruise enforces it, request flow example (record payment: form → action → Zod → use case → domain → ledger port → Mongo transaction → revalidatePath), ports list and adapters (Mongo + in-memory), why MongoDB instead of Prisma/Postgres and how the replacement test still holds, money/date decisions, authorization policy, traceability (append-only ledger + audit log), testing strategy per layer, known trade-offs (more files, mappers, barrels).
- **Commit:** `docs: project ARCHITECTURE.md justifying the design choices`

#### T6.2 README for graders (s.57, PROJECT.md §6)
- **Steps:** installation, `.env` variables (match `.env.example` exactly), in-memory mode (`no DATABASE_URL`), `pnpm --filter @cashpilot/infra seed`, demo accounts (`DEMO_LOGIN=true` + three buttons), checks/tests/E2E commands, deployment on Vercel (+ env list, Atlas network access), chosen sector + original feature (recurring retainers), **AI tools & external resources declaration** (OpenCode/Claude/GLM, Stitch, fonts, pdf-lib, Cloudinary…), known limitations. Remove claims about Tailwind/shadcn/Resend/Axiom if they are not used.
- **Commit:** `docs: README with setup, demo accounts, tests and AI declaration`

#### T6.3 Final verification
```bash
pnpm install --frozen-lockfile
pnpm turbo run lint typecheck test build
pnpm depcruise
pnpm --filter @cashpilot/web test:e2e
```
Then walk the defense scenario manually against Atlas (seeded) and report results to the user. Update `AGENTS.md` phase line to `Current phase: delivery`.

---

## 4. Definition of done (whole plan)

- [ ] `pnpm depcruise` runs in CI and has 0 errors; `apps/web` has no dependency on `@cashpilot/db` or `@cashpilot/domain`.
- [ ] No `any`, `as any`, `eslint-disable`, `await import("@cashpilot/...")`, `new Date()` in domain/application, `crypto.randomUUID()` in application.
- [ ] `grep -rn "demo\." apps/web/src` is empty; every action uses the actor's company.
- [ ] Every mutating use case calls `authorize(...)` with a permission; a test proves the collaborator is rejected.
- [ ] Real balance = sum of movements; forecast can be negative; Example A and B numbers from `UNDERSTANDING.md` §5 are asserted in domain tests.
- [ ] Payments/expense payments are atomic, append-only, idempotent (`operationId`).
- [ ] Audit log entries for every financial/security action.
- [ ] Domain has tests for every rule; infra has integration tests; ≥ 3 E2E journeys including the defense scenario.
- [ ] `docs/ARCHITECTURE.md` justifies the design; README lets a grader run the app and log in as each role.
