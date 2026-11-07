# Prompt 1 — Understand the project (paste this into OpenCode)

> Before pasting: make sure these files are in the repo:
> `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, and the skill at `.opencode/skills/clean-nextjs-monorepo/SKILL.md`.

---

```text
You are my senior full-stack mentor and pair-programmer. We are starting a student project called CashPilot, built with Next.js (App Router), React and a Clean Architecture monorepo.

PHASE 1 — UNDERSTAND ONLY. Do NOT write application code, do NOT scaffold the monorepo, do NOT install anything yet. This phase is only about understanding the idea deeply and agreeing with me on it.

## Step 1 — Read, in this order
1. Load the skill `clean-nextjs-monorepo` (it contains the architecture rules you must follow for the whole project).
2. Read `docs/PROJECT.md` completely (the functional specification of CashPilot, in French).
3. Read `docs/ARCHITECTURE.md` (the course architecture: Next.js App Router + Clean Architecture + pnpm/Turborepo monorepo).
4. Skim `docs/DESIGN.md` only to know a design phase will follow; do not work on design now.

## Step 2 — Re-explain the project to me, in detail, in English
Explain it as if teaching a smart friend who has never heard of cash-flow management. Use plain words, small concrete numbers (use the spec's example: 5 000 DT balance, 3 000 DT expected receipt, 6 000 DT planned expenses, a 20-day client delay), and simple tables where useful. Cover:
- The real-world problem (why profitable companies still run out of cash) and who suffers from it.
- The goal of the app and its core idea: real cash vs. forecast cash, and the "What if?" simulation.
- Each of the 3 roles (Dirigeant, Gestionnaire financier, Collaborateur): what they see, what they can do, what they must NOT be able to do, with a short day-in-the-life scenario for each.
- Each of the 10 modules: purpose, main data, main actions.
- The forecast formula, explained step by step, then worked through on a timeline with dates for two scenarios (normal vs. client pays 20 days late) so I can see the cash-shortage window.
- The state machines: invoice lifecycle and expense lifecycle (allowed and forbidden transitions).
- Every validation criterion from the spec, rewritten as a precise, testable rule ("Given … when … then …").
- The defense scenario from the spec, step by step.
- The grading grid, and what it implies about where to invest effort.

## Step 3 — Write `docs/UNDERSTANDING.md`
Create this file as the team's single reference of understanding. Sections:
1. Problem and objectives (short)
2. Glossary (French term ↔ English term ↔ definition) — e.g. encaissement, décaissement, échéance, solde réel, solde prévisionnel, reste à payer, brouillon
3. Roles and a DRAFT permissions matrix (actions × roles). The spec says detailed rights are defined at framing time, so propose a sensible matrix and mark it "to validate".
4. Business rules: numbered list (BR-01, BR-02, …), each one testable, each tagged with the module and the layer that should own it (domain / application / infra / presentation)
5. Forecast engine specification: inputs, formula, date handling (which date counts for a partial payment, overdue invoices, how to avoid double counting), horizons 30/60/90, and 2 fully worked numeric examples with expected outputs I could later turn into unit tests
6. Simulation specification: scenario model, hypotheses types (client delay, new expense, expected extra income), guarantee "never mutates real data", comparison output
7. Money handling decision: currency (DT/TND has 3 decimals = millimes), store integers, a `Money` value object, rounding policy
8. Draft domain model: aggregates, entities, value objects, domain errors (with codes), domain services (e.g. forecast), and which ports the application layer will need (repositories, Clock, PdfExporter, FileStorage, PasswordHasher, etc.) — names in business vocabulary, no Prisma vocabulary
9. Mapping to the monorepo packages (what goes in domain, application, infra, db, ui, apps/web) per module
10. Multi-tenancy and security: how company data isolation is guaranteed server-side (every use case receives the acting user + company)
11. Traceability: how validated financial operations keep history and how corrections work (reversal/adjustment operations, never deletion)
12. Risks, ambiguities and traps (e.g. paying more than the remaining amount, expense refused then paid, double-counting a received payment in the forecast, timezone/date-only handling, invoice cancellation after partial payment)
13. Candidate "original features" for the sector choice (agency, training center, shop, service company). Propose 4–6, each with value, effort (S/M/L) and which business rule it adds. Recommend one.
14. Delivery plan mapped to the 5 milestones of the spec (Cadrage, V1, V2, V3, Livraison), with a vertical-slice order that respects the skill's order of work
15. Open questions for me

## Step 4 — Ask me the open questions
After writing the file, ask me a SHORT numbered list (maximum 8) of the decisions only I can make. Include at least: sector/business type; UI language (French / English / both); currency display; authentication approach (credentials via a port-based auth, or an auth library) and demo accounts; number of team members and Git workflow; database hosting for development and for the deployed demo; deployment target (Vercel or Docker); and whether the PDF export should be a real PDF file. For each question, give your recommended default so I can answer "ok" quickly.

## Rules for this phase
- Do not write or modify any file except `docs/UNDERSTANDING.md`.
- If something in the spec is ambiguous, do NOT silently decide: list it under open questions or mark it as an assumption.
- Keep the Clean Architecture vocabulary from the skill (domain, application, ports, adapters, composition root).
- Finish with a 10-line "what I understood" recap and then STOP and wait for my answers. Do not start design or code.
```

---

## What to do after OpenCode answers

1. Answer its questions (or say "use your defaults").
2. Skim `docs/UNDERSTANDING.md` — especially the permissions matrix and the business rules. Fix anything wrong.
3. Then paste **Prompt 2** (`02-design-with-stitch.md`).
