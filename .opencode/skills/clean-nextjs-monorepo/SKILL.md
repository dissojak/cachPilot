---
name: clean-nextjs-monorepo
description: Rules for building a full-stack project as a Next.js App Router + Clean Architecture + pnpm/Turborepo monorepo (domain, application, infra, db, ui, config packages, apps/web). Use this skill whenever starting, scaffolding, extending, reviewing or refactoring the project, creating any entity, use case, port, repository, Server Action, page, Prisma model, test, CI file or package, or whenever unsure where a file belongs or which layer may import what. Always load it before writing code, even for small features.
---

# Clean Architecture Next.js monorepo — project rules

This skill makes you build the project **exactly** as defined in the course document `docs/ARCHITECTURE.md` (a Markdown version of the course "Next.js, Clean Architecture et Monorepo"). The course example is *TaskFlow*; the real project (the user's chosen idea) reuses the same architecture and replaces only the business domain.

Guiding principle: **métier > framework**. Next.js, Prisma and Turborepo are replaceable tools; business rules are not. Start with the domain, never with the page.

## 0. Before writing any code

1. Read `docs/reference/COURSE-ARCHITECTURE.md` (the course) and `docs/ARCHITECTURE.md` (this project's choices) (if they are missing, ask the user to add it; do not improvise the architecture from memory).
2. Read the project brief (`docs/PROJECT.md` or the idea the user described). If no brief exists, ask the user for it and write it to `docs/PROJECT.md` before coding: users/roles, features, business rules, validation criteria, grading criteria.
3. Choose one package scope from the project name (for example `@campus/*`, `@cashpilot/*`, `@localimpact/*`) and use it everywhere. The course uses `@acme/*`; treat it as a placeholder.
4. Check installed versions of Next.js, Prisma, Turborepo, Zod and Vitest, and verify version-sensitive APIs in the official docs rather than relying on the course snippets or memory. Known examples: in Next.js 16+ `middleware.ts` is named `proxy.ts`; Prisma 7 changes client generation and configuration.
5. Work in **small steps** following section 9. After each step: run the checks (section 8), then tell the user what you did, which layer each file belongs to, and what comes next.

## 1. Stack

- Language: TypeScript, `strict: true` and `noUncheckedIndexedAccess` everywhere (one shared base tsconfig).
- Framework: Next.js **App Router** only. Never create a `pages/` directory.
- Monorepo: **pnpm workspaces** + **Turborepo**. Internal deps use `"workspace:*"`.
- Database: PostgreSQL via **Prisma**, isolated in `packages/db`.
- Validation at the edges: **Zod**.
- Tests: **Vitest** (domain, use cases, infra integration) and **Playwright** (E2E).
- Architecture guard: **dependency-cruiser** (`pnpm depcruise`) run in CI.
- CI: GitHub Actions. Deploy: Vercel (root directory `apps/web`) or Docker (`output: 'standalone'`).

## 2. Repository layout (do not invent other top-level structure)

```
<project>/
├── apps/
│   └── web/src/
│       ├── app/            # routes, layouts, loading/error, Server Actions, route handlers (thin)
│       ├── container/      # composition root: the ONLY place that wires ports to implementations
│       └── components/     # presentation components (Server by default)
├── packages/
│   ├── domain/src/<bounded-context>/   # entities, value objects, domain errors, pure rules
│   ├── application/src/
│   │   ├── <bounded-context>/          # use cases (+ DTO types)
│   │   ├── ports/                      # interfaces: repositories, Notifier, Clock, Logger, ...
│   │   └── result.ts
│   ├── infra/src/prisma/               # Prisma repositories + mappers (+ other adapters)
│   ├── db/                             # prisma/schema.prisma, migrations, src/index.ts client
│   ├── ui/src/                         # shared presentational components
│   └── config/                         # eslint, tsconfig, tailwind presets, typed env
├── docs/                   # ARCHITECTURE.md, PROJECT.md
├── pnpm-workspace.yaml     # packages: apps/*, packages/*
├── turbo.json              # tasks: build, test, lint, typecheck, dev (cache false, persistent)
├── .dependency-cruiser.cjs
├── .github/workflows/ci.yml
└── package.json            # private, packageManager pinned, scripts via turbo
```

Rules: apps may depend on packages; a package never depends on an app. Folders are named after business concepts (`tasks`, `billing`, `requests`), never `utils`/`helpers`. Avoid giant barrel files: each package exposes a small, deliberate `exports` surface (`.` and `./ports` where useful). Packages are "just-in-time" (exports point to `src/*.ts`) and Next.js lists them in `transpilePackages`.

## 3. Dependency rule (hard constraint)

Inner layers never import outer layers.

| Layer (package) | May import | Must NEVER import |
|---|---|---|
| Domain (`packages/domain`) | nothing (pure TS) | Prisma, Next.js, React, Zod, `process.env`, any I/O, application, infra |
| Application (`packages/application`) | domain | Prisma, `@prisma/client`, Next.js, React, infra, db |
| Infrastructure (`packages/infra`) | application, domain, db | Next.js, React, apps |
| Database (`packages/db`) | `@prisma/client` | everything else; only `infra` imports it |
| Presentation (`apps/web`) | application (use cases, DTOs, `Result`), ui, config | domain internals when avoidable, db, Prisma types |
| Composition (`apps/web/src/container`) | infra, application | — (the only place allowed to import infra) |

Tests for yourself: the **name test** (folders speak business), the **import test** (a domain file importing a tool means the architecture leaks), the **replacement test** (changing the ORM touches one package only).

When configuring dependency-cruiser, forbid domain → `@prisma|next|react`, application → infra/db/next/react, and apps → `db`/`infra`, **but exempt `apps/web/src/container`** (use `from.pathNot`) because the composition root legitimately imports infra. Fix the rule, never the architecture, if this conflicts.

## 4. Layer rules

### Domain
- Entities have a **private constructor** and a static `create()` that enforces invariants, plus `restore()` for rehydration and `snapshot()` for controlled read access.
- No public setters. Express intentions as methods (`complete()`, `approve()`, `accept()`), never `x.status = ...` from outside.
- Value objects for identifiers and constrained values (`TaskId`, `Money`, `Email`, ...). Prefer integers for money (smallest currency unit) — never floats.
- Business state machines (allowed transitions) live in the entity and throw typed errors on illegal transitions.
- Domain errors extend `Error`, carry a stable `code` (`TITRE_TROP_COURT` style), and no HTTP/UI knowledge.
- Time and randomness: pass `now`/ids in or use ports; domain methods accept `now = new Date()` as a parameter for testability.
- Unit tests required for every rule; they must run in milliseconds with zero mocks of infrastructure.

### Application
- One class per use case with `execute(input: Dto): Promise<Output>`; dependencies come through the constructor as **ports**.
- Ports are plain interfaces in business vocabulary (`byId`, `all`, `save`, `forInvoice`), never `findMany`/`where`/`select`.
- Use cases orchestrate: load aggregates via ports → call domain behavior → save via ports. Business rules stay in the domain; a use case with no rule and no orchestration is a smell (empty layer).
- **Authorization is a business rule**: pass the acting user (id + role/membership) in the input and check permissions inside the use case (defense in depth; middleware only protects URLs). Throw typed errors such as `Forbidden`.
- Cross-cutting needs are ports too: `Clock`, `Notifier`, `Logger`, `PasswordHasher`, `IdGenerator`, file storage.
- Inputs/outputs are plain serializable DTOs; never HTTP objects, never Prisma types.
- Use `Result<T>` or typed errors consistently, as shown in the course.

### Infrastructure
- `implements <Port>` for every adapter so the compiler checks conformance. Prisma appears **only** here and in `packages/db`.
- Mappers (`toDomain` / `toPersistence`) separate table models from domain models; `@prisma/client` types never leave this package.
- Always provide an **in-memory adapter** for each repository (tests and demo mode). Integration-test the Prisma adapters against a real Postgres (Testcontainers) with a few tests per repository.
- Wrap multi-step writes that must be atomic in a transaction inside the adapter, behind a port method (do not leak transactions into use cases).

### Presentation (`apps/web`)
- Server Components by default; add `'use client'` only on interactive leaf components (forms, toggles, filters). Never mark a whole page as client for one button.
- Pages read data by calling use cases from `@/container` (`await useCases.listX.execute(...)`). No Prisma, no business rules in `app/`.
- Mutations are **Server Actions** (`'use server'`): parse input with Zod (`safeParse`), call a use case, map domain error codes to user messages, then `revalidatePath`/`revalidateTag`. Return `{ ok, ... }` objects for expected errors; let unexpected errors reach `error.tsx` and logging.
- Route Handlers (`route.ts`) only when an external client needs HTTP (mobile, webhook, third party). They are transport only: parse → use case → response. Never call your own route handlers from your own pages.
- Provide `loading.tsx`, `error.tsx` and explicit empty states for every data page; keep the UI responsive and accessible (labels, roles, keyboard navigation).
- Zod validates **shape** (types, lengths, formats); the domain validates **rules**. Do not put business rules in Zod schemas or the reverse.
- Auth gating: middleware/proxy checks only session presence for URL groups (no Prisma, no heavy logic); real permission checks happen in use cases.
- Env vars: validated once at startup in `packages/config` with Zod; only `NEXT_PUBLIC_*` reaches the browser; declare env in `turbo.json` so the cache key stays correct.

### Composition root
- `apps/web/src/container/index.ts` instantiates adapters and use cases with plain constructors (no DI framework unless the user asks). Exports a `useCases` object. Support swapping to in-memory adapters through an env flag for demos and E2E.

## 5. Next.js specifics to respect
- Since Next.js 15, `fetch` is not cached by default; make caching explicit (`cache`, `next.revalidate`, `tags`) and invalidate by tag/path after mutations.
- Reading cookies/headers makes a route dynamic; pick the rendering strategy deliberately for each critical page (SSG / SSR / ISR / streaming).
- Use `Promise.all` for independent reads; stream slow parts with `Suspense`/`loading.tsx`.
- Only `page.tsx` and `route.ts` create URLs; other files may live in `app/` safely (co-locate `actions.ts`, `schemas.ts`).

## 6. Monorepo tooling rules
- `turbo.json` tasks: `build` (`dependsOn ["^build"]`, outputs `.next/**` minus cache, `dist/**`), `test`, `lint`, `typecheck` (all `dependsOn ["^build"]`), `dev` (`cache: false`, `persistent: true`). Make `db:generate` a dependency of build/test where Prisma client generation is needed.
- Root scripts delegate to turbo (`dev`, `build`, `test`, `lint`, `typecheck`, `depcruise`).
- Shared configs live in `packages/config` (tsconfig base + next preset, ESLint base, Tailwind preset). Packages extend them; no copy-pasted configs.
- Import packages by name (`@scope/domain`), never with relative paths across packages.
- Use `pnpm install --frozen-lockfile` in CI. Add `pnpm changeset` only if the user wants versioning.

## 7. Testing rules (one strategy per layer)
- **Domain**: many fast unit tests (all rules, state transitions, error codes).
- **Application**: use-case tests with in-memory fakes of ports and `vi.fn()` for notifiers; assert behavior, not implementation.
- **Infra**: a few integration tests per Prisma repository against a disposable Postgres.
- **E2E (Playwright)**: only 3–10 critical journeys (login, main create flow, the project's headline scenario), using `getByRole`/`getByLabel`.
- Every business rule listed in the project's "validation criteria" must have at least one automated test at the lowest possible layer.

## 8. Checks to run after every step
```bash
pnpm turbo run lint typecheck test
pnpm depcruise
pnpm turbo run build        # before finishing a milestone
```
Do not move on while a check fails. Never disable a lint/dependency rule to make it pass; fix the code or ask the user.

## 9. Order of work (follow the course steps)
1. **Skeleton**: pnpm workspaces, `turbo.json`, `packages/config`, empty packages with `exports`, base CI.
2. **Domain**: entities, value objects, domain errors + unit tests for the project's core rules.
3. **Use cases + ports**: the first vertical slice only; then the rest feature by feature.
4. **Fakes**: in-memory repositories + use-case tests.
5. **Prisma**: `packages/db` schema/migrations, Prisma repositories + mappers + integration tests, seed with demo data and demo accounts.
6. **Interface**: App Router pages, Server Actions, Zod schemas, loading/error/empty states, responsive layout, accessible navigation, `apps/web` role-based route protection.
7. **Guard rails**: dependency-cruiser, typed env, GitHub Actions CI.
8. **Delivery**: critical E2E journeys, deployment (Vercel or Docker), README.

Build **vertical slices** (domain → use case → adapter → UI) per feature in the order of the project's milestones, not layer by layer across the whole app, once the skeleton and the first slice exist.

## 10. Project-level requirements (apply to whatever idea is chosen)
- Persistent database; data survives reloads; seed script with demo data.
- Server-side validation and **server-side permission checks** for every mutation; forbidden actions must be blocked on the server, not only hidden in the UI.
- Reusable components, several pages, loading/error/empty states, responsive UI, accessible navigation.
- Regular, identifiable Git commits (small commits per step, clear messages; one concern per commit).
- `README.md`: installation, configuration (`.env.example`), demo accounts, how to run tests, known limitations. Declare any use of AI tools or external resources (the course requires this declaration).
- `docs/ARCHITECTURE.md` justifying the choices (layers, ports, trade-offs) — this is a course deliverable.
- Be ready to explain every part of the code: prefer simple, readable code over cleverness, and add short comments where a business rule is not obvious. The student must be able to modify it live.

## 11. Adapting the TaskFlow example to the real project
Map the course vocabulary to the chosen idea; keep the same layering.

- **CampusConnect** (student help): aggregates `HelpRequest` (open → help accepted → done), `Proposal`, `Rating`, `Report`. Rules: only the author accepts a proposal or edits the request; closed requests accept no proposals; ratings only by participants after closing. Roles: student, admin (moderation).
- **LocalImpact** (issue reporting): aggregates `Issue` (new → taken in charge → in progress → resolved), `Support` (one per user per issue), `Comment`, `StatusChange` history. Rules: only the assigned manager or an admin changes status; resolving requires an intervention description; every transition is recorded with date and author; dashboard stats computed from stored data. Roles: user, manager, admin.
- **CashPilot** (cash-flow forecasting): aggregates `Company`, `Invoice`, `Payment`, `Expense`, `CashMovement`, plus a pure `Forecast`/`Scenario` domain service. Rules: partial payments reduce the remaining amount and never exceed it; refused expenses cannot be paid; a realized operation affects the real balance once; forecast = reference balance + expected receipts − planned disbursements up to the date; simulations never mutate real data; per-company data isolation; corrections via traceable operations. Use a `Money` value object (integer minor units: 1 DT = 1000 millimes) to avoid rounding errors.

Whatever the idea: name ports in business language, keep state machines in entities, and keep the original "original feature" (if the brief asks for one) as its own use case + domain rule + tests.

## 12. Anti-patterns to refuse
- Prisma/DB calls inside `page.tsx`, components or Server Actions.
- Business rules in React components, Zod schemas or route handlers.
- Anemic entities (public fields + setters) and use cases that only forward to a repository.
- `@prisma/client` types or HTTP/Next types crossing into application/domain.
- Whole pages marked `'use client'`; internal API routes consumed by the app's own pages.
- Relative imports across packages; `utils`/`helpers` dumping grounds; giant barrel files.
- Floating-point money; hidden `new Date()` inside domain logic without a parameter or `Clock` port.
- Disabling lint, TypeScript strictness or depcruise rules to get green.

## 14. Separation of concerns (data, utils, hooks)

Keep code split by responsibility and layer. Do not put everything in one file or folder.

- Data access and fetching live in repositories/adapters (`packages/infra`, `packages/db`), never in components or hooks.
- Hooks are presentation-only (`apps/web`): UI state, form state, local interaction. They call use cases; they do not contain business rules or direct DB calls.
- Utils are small, pure, generic helpers. They must not contain domain rules, authorization, money calculations, or data fetching.
- Feature code should be grouped by business concept (invoices, expenses, forecast), not only by technical type.
- Shared UI goes in `packages/ui`; app-specific UI goes in `apps/web/src/components`.

This does not break the architecture if respected. It breaks the architecture if utils/hooks become dumping grounds or bypass use cases/repositories.
- Before creating files, state in one sentence which layer/package they belong to and why.
- If a request would break the dependency rule, say so, propose the compliant alternative (usually a new port + adapter), and proceed with that.
- Keep each step small enough to review; end with the checks you ran and the proposed next step.
