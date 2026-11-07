# Prompt 2 — Design the interfaces with Stitch (paste this into OpenCode after Phase 1)

> Before pasting: `docs/UNDERSTANDING.md` must exist and its open questions must be answered. Put the reference screenshot (the CPJ juice-shop page) in `docs/reference/cpj-reference.png` so OpenCode and Stitch can use it.
>
> **About Stitch:** Google Stitch (stitch.withgoogle.com) is an AI UI design tool. It accepts text prompts and reference images, generates several screens at once, uses a `DESIGN.md` file for design-system rules, and offers an MCP server so a coding agent can read or generate designs. If you have not connected the Stitch MCP server to OpenCode, the prompt below makes OpenCode prepare everything and hand you ready-to-paste prompts instead (`prompts/03-stitch-screen-prompts.md`).

---

```text
PHASE 2 — INTERFACE DESIGN with Google Stitch. Still NO application code: this phase produces design decisions, a screen inventory and Stitch prompts/designs only.

## Step 1 — Read
1. Load the skill `clean-nextjs-monorepo`.
2. Read `docs/UNDERSTANDING.md` (our agreed understanding), `docs/PROJECT.md`, and `docs/DESIGN.md` (our design system: nature colors, forest-futuristic, Apple-like, Outfit + Inter + JetBrains Mono, glass cards, uiverse.io elements restyled to our tokens).
3. Look at the reference image `docs/reference/cpj-reference.png`. Describe, in 6 bullets, which structural ideas we borrow from it (centered hero, ghost typography behind it, left floating vertical filter tabs, amount pill with attached "+" button, underlined secondary link, tiny footer) — and confirm we do NOT copy its colors or its product.

## Step 2 — Screen inventory: write `docs/SCREENS.md`
Derive the screens from the roles and modules in `docs/UNDERSTANDING.md`. For every screen give: name, route, role(s) allowed, purpose (1 line), main content blocks, primary action, key states to design (loading, empty, error, success), data it needs (which use case provides it — name the use case, e.g. `GetDashboard`, `ListInvoices`, `RecordPayment`, `GetForecast`, `RunSimulation`), and which business rules it must make visible (e.g. "remaining amount cannot be exceeded" shown inline in the payment form).
Cover at least: login; create company + opening balance; Dirigeant dashboard; Gestionnaire dashboard; invoices list; invoice editor (draft); invoice detail with partial payment and history; clients & suppliers (list + detail with history); expense submit (Collaborateur); "my requests" (Collaborateur); expense approval queue (Dirigeant); treasury ledger (real movements and balance history); forecast 30/60/90; simulation "What if?" with scenario comparison; alerts center; members & permissions; and the screen(s) for the original feature chosen in Phase 1.
Also draw the main user flows as simple text diagrams (e.g. invoice → partial payment → treasury → forecast) and the defense scenario as a click-path across screens.

## Step 3 — Prepare the design system for Stitch
- Check `docs/DESIGN.md` against Stitch's DESIGN.md expectations (colors, typography, spacing/rounding, components, do/don't). If Stitch exposes its own DESIGN.md editor, make sure ours is imported there; keep our file as the source of truth.
- Verify text/background contrast pairs from our palette meet WCAG AA and tell me about any pair that does not.

## Step 4 — Generate the designs
- If the Stitch MCP server is available in this session: create a Stitch project "CashPilot", import `docs/DESIGN.md`, attach the reference image as style/structure inspiration, and generate screens in batches of at most 5 (Batch 1: login, create company, Dirigeant dashboard, Gestionnaire dashboard, invoices list; Batch 2: invoice detail + partial payment, invoice editor, expense submit, my requests, expense approval queue; Batch 3: treasury ledger, forecast, simulation comparison, alerts, members & permissions). Generate desktop first, then mobile variants of the 5 most important screens (dashboard, invoice detail, expense submit, forecast, simulation).
- If the MCP server is NOT available: do not pretend. Say so, and instead produce/refresh `prompts/03-stitch-screen-prompts.md` with one self-contained, copy-paste prompt per screen (each one repeating the style essentials: palette, fonts, glass cards, reference structure, realistic sample data from our example company, and the states to show). Then wait for me to generate in Stitch and bring back the results (screenshots or exported HTML).
- Use realistic sample data everywhere (company "Atelier Pixel", client "Delta", balance 5 000 DT, invoice 3 000 DT due day 20, expense 6 000 DT due day 25, simulated 20-day delay). No lorem ipsum.
- Every data screen must show its empty, loading and error states (as separate frames or variants).

## Step 5 — Review loop
After each batch, review the result against this checklist and tell me what to fix with a ready-to-paste refinement prompt:
1. Does it look calm, spacious and Apple-like (one hero element, lots of whitespace)?
2. Palette: nature greens only plus our semantic colors (clay for negative, amber for warning, bio-glow only for focus and the simulated scenario)?
3. Fonts: Outfit for display/numbers, Inter for UI, JetBrains Mono for tiny labels?
4. Frosted-glass cards, 28 px radius, soft green shadows, no harsh borders?
5. Structure borrowed from the reference (centered nav, left floating filter tabs, amount pill with "+", underlined link, ghost typography)?
6. Business rules visible in the UI (remaining amount, refused expense cannot be paid, simulation clearly separated from real data with a visible "Simulation — real data not modified" banner)?
7. Status never conveyed by color alone; contrast AA; mobile layout sane?
8. Are uiverse.io elements used where planned (buttons, glass cards, inputs/switches, loaders, tooltips), restyled to our tokens, with element names + URLs listed in `docs/EXTERNAL_RESOURCES.md` for the README declaration?

## Step 6 — Hand-off notes for implementation (documentation only)
When I approve the designs, write `docs/UI_HANDOFF.md`: design tokens → Tailwind preset in `packages/config/tailwind`; reusable presentational components to live in `packages/ui` (names, props, variants); which components are Server vs Client Components (interactive leaves only: filters, forms, charts' tooltips, theme toggle); how Stitch's HTML/CSS will be converted to React + Tailwind WITHOUT putting business logic in the UI package; chart library recommendation compatible with Server Components; accessibility notes. Do not implement yet.

## Rules for this phase
- Do not write application code or install dependencies.
- Do not invent business rules: if a design needs a rule not in `docs/UNDERSTANDING.md`, flag it and ask me.
- Keep the UI strictly presentational: it displays what use cases return; no calculations in components.
- Declare every external resource (Stitch, uiverse.io elements, fonts, AI tools) in `docs/EXTERNAL_RESOURCES.md`; the course requires this declaration.
- Work in small steps; after each step tell me what you produced and what you need from me. Stop after Step 6 and wait for my approval before any implementation.
```

---

## If OpenCode cannot talk to Stitch

1. Open `prompts/03-stitch-screen-prompts.md`, go to stitch.withgoogle.com, create a project.
2. Paste the **Master style prompt**, attach `cpj-reference.png`, and import `docs/DESIGN.md` into Stitch's design-system / DESIGN.md area.
3. Paste the batch prompts one by one (Stitch generates up to ~5 screens at once).
4. Bring screenshots or exports back to OpenCode and continue at Step 5.
