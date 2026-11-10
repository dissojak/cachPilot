# CashPilot

Cash-flow tracking and forecasting for a small business (sector: **digital agency**). CashPilot follows the real balance, forecasts cash at 30/60/90 days from unpaid invoices and approved expenses, simulates decisions ("what if a client pays 20 days late?") without touching real data, and controls spending (submit → approve/refuse → pay).

Architecture and design choices: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Functional spec: [`docs/PROJECT.md`](docs/PROJECT.md).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · pnpm + Turborepo · MongoDB Atlas + Mongoose · Auth.js (Google OAuth) · Zod · pdf-lib · Vitest · dependency-cruiser · GitHub Actions · Vercel.

## Setup

```bash
pnpm install
cp .env.example .env   # then fill it
pnpm dev               # http://localhost:3000
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | MongoDB Atlas connection string (`mongodb+srv://…`). Atlas is a replica set, which the payment transactions need. |
| `AUTH_SECRET` | yes | Long random string (`npx auth secret`). |
| `AUTH_URL` | yes | App URL, e.g. `http://localhost:3000`. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | yes | Google OAuth client. Redirect URI: `<AUTH_URL>/api/auth/callback/google`. |
| `CLOUDINARY_URL` | no | `cloudinary://key:secret@cloud` to store expense receipts; without it receipts are kept in memory only. |

## Using the app

There is **no demo data**: everything you see comes from the database.

1. Sign in with Google. The first time, you land on **Create your company** (name, sector, cash in the bank today). You become its **owner**.
2. Ask teammates to sign in once, then add them by e-mail in **Settings → Members** as *finance manager* or *collaborator*.
3. Roles (checked on the server for every action):
   - **Owner** — dashboard, cash, forecast, simulations, approves/refuses expenses, manages company and members.
   - **Finance manager** — customers, invoices, payments, pays approved expenses, cash adjustments, forecast, simulations, retainers.
   - **Collaborator** — submits expenses and sees only their own.

Defense scenario: create the company with an opening balance → add a customer → create and validate an invoice → record a partial payment → a collaborator submits an expense, the owner approves it → open **Forecast** → **Simulations**: create a scenario, add "client pays late" on the invoice → compare base and simulated lines and the shortage window.

## Checks and tests

```bash
pnpm turbo run lint typecheck test build   # everything (the infra tests download a MongoDB binary the first time)
pnpm depcruise                             # architecture rules (layers)
pnpm --filter @cashpilot/web test:e2e      # Playwright smoke test of the login page
```

## Deployment

Vercel, root directory `apps/web` (see `vercel.json`). Set the variables above in the Vercel project and allow Vercel's IPs in Atlas → Network Access. Update the Google OAuth redirect URI to the production URL.

## Known limitations

- One line per invoice in the form (the domain supports several).
- Members must sign in once before they can be added (no invitation e-mails).
- No bank integration: operations are recorded manually, as the spec allows.
- The end-to-end tests only cover the login page, because signing in requires a real Google account.

## AI tools and external resources (declared as required by the course)

- **AI assistants**: OpenCode with GLM and Claude (Claude Code) were used for planning, code generation, refactoring and review. Every change was reviewed and is explained in the commits.
- **Design**: Google Stitch for the first mockups (`docs/DESIGN.md`, `prompts/`).
- **Libraries**: Next.js, Auth.js, Mongoose, Zod, pdf-lib, Motion, Vitest, mongodb-memory-server, dependency-cruiser.
- **Services**: MongoDB Atlas, Google OAuth, Cloudinary, Vercel.
- **Fonts**: Inter, Outfit, JetBrains Mono.
