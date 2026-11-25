# CashPilot — UI redesign: what is still to do

Branch: `ui/redesign` (22 commits on top of `main`, not pushed, not merged).

## Verified state

- Lint, typecheck, tests: pass (18/18 tasks).
- `pnpm depcruise`: no violations.
- Production build: compiles.
- E2E: `login.spec.ts` passes (run on port 3100).

## Still to do

### Features
- [ ] Edit a submitted expense. `UpdateSubmittedExpense` exists in the container but no page calls it.
- [ ] Edit a retainer. `UpdateRetainer` exists in the container but no page calls it.
- [ ] Decide on the sector-specific feature marker. The "Agency feature" eyebrow was removed from the retainers page. Re-add it, or put the agency angle in the description, once the team agrees on the sector.

### Verification
- [ ] Visually check every signed-in page in a browser. Only the login page has been checked, because the other pages need Google sign-in.
- [ ] Add E2E coverage beyond the login page: create invoice, partial payment, expense approval, forecast, simulation. The spec file has only one test.
- [ ] Check the mobile layout (sidebar drawer, tables with horizontal scroll) at 375px wide.

### Design polish (optional)
- [ ] Decide whether the small mono eyebrow above each page title stays. It is now sentence case, but the skill guidance calls unneeded labels above content a template tell.
- [ ] Review the invoice payment form and the expense approve/refuse screens (`invoices/[id]`, `expenses/[id]`). They were not redesigned in this pass beyond class cleanup.

### Housekeeping
- [ ] Commit or discard the local `.gitignore` change (`.claude/` line), which is not part of this branch.
- [ ] Install Playwright Chromium on each machine that runs E2E: `pnpm exec playwright install chromium`.
- [ ] Note for the team: port 3000 on the dev machine is used by an unrelated Next.js app. Run CashPilot on another port (for example `pnpm exec next start -p 3300`).

### Architecture (from `docs/FIX-PLAN.md`, not part of this UI pass)
- [ ] Remaining FIX-PLAN phases (domain rules, application permissions, infra mappers, ledger transactions) are not covered by this branch.
