# CashPilot — Team Guide

This guide is for teammates who will work on pages, features or fixes. Read it before touching code.

## 1. What the project is

CashPilot helps a small business track real cash, forecast cash at 30/60/90 days, simulate decisions ("what if a client pays late?"), and control expenses (submit → approve/refuse → pay). There is no bank integration.

## 2. Read order

1. `docs/PROJECT.md` — functional specification.
2. `docs/ARCHITECTURE.md` — course architecture.
3. `docs/UNDERSTANDING.md` — business rules, domain model, decisions.
4. `.opencode/skills/clean-nextjs-monorepo/SKILL.md` — architecture rules.
5. `docs/DESIGN.md` — design system (for UI work).
6. `docs/TEAM-GUIDE.md` — this file.

## 3. Decisions already made

- Language: English UI.
- Currency: DNT, stored as integer millimes (1 DNT = 1000 millimes).
- Database: MongoDB Atlas.
- Auth: OAuth (Auth.js recommended), no custom auth.
- Deployment: Vercel only.
- Git: feature branches + pull requests.
- PDF: easiest server-side option.
- State: Redux Toolkit only for client UI state.
- Logs: structured logs + audit logs.

## 4. Where code goes

- `apps/web/src/app` — routes, layouts, Server Actions, route handlers (thin).
- `apps/web/src/container` — composition root only (wires ports to adapters).
- `apps/web/src/components` — presentation components (Server Components by default).
- `packages/domain` — entities, value objects, errors, pure rules. No framework imports.
- `packages/application` — use cases, ports, DTOs. Depends only on domain.
- `packages/infra` — MongoDB repositories, mappers, adapters (PDF, storage, logger).
- `packages/db` — MongoDB connection and schemas.
- `packages/ui` — shared presentational components.
- `packages/config` — shared configs and typed env.

Rule: apps may depend on packages; packages never depend on apps. Domain depends on nothing.

## 5. How to add a feature (vertical slice)

1. Domain: entity/value objects/rules + unit tests.
2. Application: use case + ports + DTO + tests with fakes.
3. Infra: repository/adapter + mapper + integration tests.
4. Web: route, Server Action, Zod schema, loading/error/empty states.
5. Run checks: lint, typecheck, tests, depcruise, build.

## 6. Security rules (mandatory)

- Never trust the client for company id or permissions.
- Every mutating use case receives the acting user (id, company, role) and checks authorization.
- Validate input with Zod at the edge and with domain rules inside.
- No long-lived tokens; use secure httpOnly cookies with short expiry and rotation.
- Never store secrets/tokens in Redux or client state.
- MongoDB: least-privilege user, allowlisted IPs, env-based connection string, no string-built queries.
- Redact secrets and PII from logs.
- Forbidden actions must be blocked on the server, not only hidden in UI.

## 7. Free services to avoid building

- Auth: Auth.js (free, open source) or Clerk (free tier).
- Database: MongoDB Atlas free M0.
- Hosting: Vercel free/hobby.
- Email: Resend or SendGrid free tiers.
- File storage: Cloudinary or UploadThing free tiers.
- Monitoring/logs: Sentry or Axiom free tiers.
- UI: shadcn/ui, Radix, Tailwind.
- Charts: Recharts.
- Validation: Zod.
- State: Redux Toolkit.
- Tests: Vitest + Playwright.

## 8. Git workflow

- Branch from `main`: `feat/...`, `fix/...`, `chore/...`.
- Open a pull request for every change.
- Small commits, clear messages, one concern per commit.
- CI must be green before merge.

## 9. Testing expectations

- Domain: many fast unit tests.
- Application: use cases with in-memory fakes.
- Infra: a few integration tests against MongoDB.
- E2E: 3-10 critical journeys (login, invoice, payment, expense approval, forecast/simulation).
- Every business rule in `UNDERSTANDING.md` must have at least one automated test.

## 11. Separation of concerns (data, utils, hooks)

Keep code split by responsibility and by layer. Do not put everything in one file or one folder.

- Data access and fetching live in repositories/adapters (`packages/infra`, `packages/db`), never in components or hooks.
- Hooks are presentation-only (`apps/web`): UI state, form state, local interaction. They call use cases, they do not contain business rules or direct DB calls.
- Utils are small, pure, generic helpers. They must not contain domain rules, authorization, money calculations, or data fetching.
- Feature code should be grouped by business concept (invoices, expenses, forecast), not by technical type only.
- Shared UI goes in `packages/ui`; app-specific UI goes in `apps/web/src/components`.

This does not break the architecture if respected. It breaks the architecture if utils/hooks become dumping grounds or bypass use cases/repositories.
