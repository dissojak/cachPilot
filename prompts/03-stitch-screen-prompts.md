# Stitch prompts for CashPilot (copy-paste)

How to use in Google Stitch (stitch.withgoogle.com):

1. Create a project named **CashPilot**.
2. Attach the reference screenshot (`cpj-reference.png`) and import/paste `docs/DESIGN.md` into the design-system (DESIGN.md) area if available.
3. Paste the **Master style prompt** once.
4. Paste one **batch** at a time (Stitch can generate about 5 screens at once). If a result drifts from the style, use the **Refinement prompts** at the end.

All sample data uses one fictional company so screens stay consistent:
**Atelier Pixel** (digital agency), currency **DT**, opening balance **4 000 DT**, client **Delta** (invoice **INV-0042**, 3 000 DT, due day 20, 1 000 DT already received, 2 000 DT remaining), so the **real balance today is 5 000 DT**. Planned expense **6 000 DT** (server + salaries) due day 25. Base forecast: 5 000 + 2 000 (day 20) − 6 000 (day 25) = **1 000 DT** (lowest point, no shortage). If Delta pays 20 days late (day 40): balance on day 25 = **−1 000 DT**, shortage from day 25 to day 40. Employee **Sara** (expense: software license 800 DT), finance manager **Yasmine**, owner **Karim**.

---

## Master style prompt

```text
Design a responsive web app called "CashPilot": cash-flow tracking and forecasting for small businesses. Style: a calm forest at dawn seen through frosted glass — nature colors, futuristic but quiet, very close to Apple's design language (generous whitespace, one hero element per screen, big readable numbers, soft depth).

Use the attached reference screenshot ONLY for structure and attitude, not for colors or product: a centered hero element surrounded by empty space; giant ghost typography behind the hero at about 6% opacity; a centered top navigation with the logo in the middle, two links on each side and a small solid button at the far right; floating vertical filter tabs on the left edge with one active tab highlighted; an amount pill with an attached square "+" button; an underlined text link as the secondary action; tiny footer links.

Colors (light theme): page background is a soft gradient from #F5F8F3 to #E9F0E6 with blurred green canopy shapes and very faint topographic contour lines; deep forest ink text #0B1F17; secondary text #4A6256; primary pine green #1F6B4E; moss #4E8B63 and fern #7FB77E for positive money; sage #CFE0CC for borders and chart grid; amber #E3A857 for warnings; clay #C2452B for negative amounts, overdue and cash shortage; lake #6FA8B8 for info; a bioluminescent mint #6CF5B8 used sparingly for focus rings, glow, and ONLY the simulated scenario line. Also provide a dark theme: background #07130E, translucent forest glass cards, text #E8F2EA.

Typography: Outfit (600) for headings and big numbers with tight tracking; Inter for UI text and tables with tabular numbers; JetBrains Mono uppercase 11px with wide tracking for tiny technical labels. Optional single italic Fraunces word in a hero headline only.

Shape and depth: frosted-glass cards (white at 65%, background blur, 1px white border), 28px card radius, pill-shaped buttons, tabs and chips, soft green-tinted shadows, airy tables without heavy borders. Add one subtle animated flourish per screen at most. Use polished open-source UI-element styles in the spirit of uiverse.io (glowing pill buttons, glass cards, toggle switches, leaf-like loaders, tooltips) restyled to this palette.

Rules: realistic sample data only (no lorem ipsum); status is never shown by color alone (always icon + label); text contrast WCAG AA; every data screen also needs empty, loading (skeleton) and error variants; amounts are right-aligned tabular numbers formatted like "2 000,00 DT". Tone of microcopy: calm and reassuring.
```

---

## Batch 1 — Entry and dashboards

### 1. Login
```text
Login screen for CashPilot. Centered glass card over the forest-mist background, huge ghost word "CASHPILOT" behind it. Logo (leaf whose midrib is a compass needle), headline "Navigate your *cash* with calm." (the word cash in Fraunces italic), email and password inputs with floating labels, primary pill button "Sign in", underlined link "Forgot password?", small demo-accounts hint chip row (Owner, Finance, Employee) that fills the form on click. Include an inline error state variant.
```

### 2. Create company with opening balance
```text
Onboarding screen: "Create your company". Three-step stepper (Company · Opening balance · Invite team). Step 2 shown: company name "Atelier Pixel", sector selector as large pill options (Digital agency selected, Training center, Shop, Service company), currency DT, opening balance input "4 000,00 DT" with a large tabular number, opening date picker. Right side: live preview glass card showing "Real balance today: 4 000,00 DT". Primary button "Continue", underlined link "Back".
```

### 3. Dashboard — Dirigeant (owner)
```text
Dashboard for the owner (Karim). Floating glass top navigation, centered logo. Hero zone: huge ghost text "BALANCE" behind a centered amount pill "5 000,00 DT" with label "REAL BALANCE" in mono, and a small forecast sparkline below. Left floating vertical tabs: 30 days (active) · 60 days · 90 days. Below the hero: three glass stat tiles (Forecast balance in 30 days "1 000 DT", Overdue invoices "1", Expenses awaiting approval "1"). A glass card "Expenses to approve" with Sara's "Software license — 800 DT" row and Approve / Refuse pill buttons. A calm alert banner in amber: "Your balance gets tight on 25 Nov (1 000 DT). If a client pays late, it could go negative." Footer tiny links.
```

### 4. Dashboard — Gestionnaire financier (finance manager)
```text
Dashboard for the finance manager (Yasmine), more operational than the owner's. Top: two stat tiles (Receivable 2 000 DT, Payable 6 000 DT). Main: a wide glass card with a 60-day cash forecast area chart (pine green line, soft fill, an amber marker on the lowest point "1 000 DT on day 25", no shortage in this base view). Right column: "Overdue & due soon" list with invoice chips (Overdue in clay with icon, Due in 5 days in amber). Quick actions as amount-pill-with-plus buttons: "New invoice +", "Record payment +", "Add expense +". Left floating tabs: Overview · Invoices · Expenses · Forecast.
```

### 5. Invoices list
```text
Invoices list. Left floating vertical filter tabs (All · Draft · Sent · Overdue · Paid · Cancelled), "Overdue" highlighted. Airy table in a glass card: number, client, issue date, due date, total, remaining (tabular, right-aligned), status chip with icon. Rows: INV-0042 Delta 3 000 DT remaining 2 000 DT Partially paid; INV-0043 Nova Studio 1 200 DT Overdue; INV-0041 Orion 800 DT Paid; INV-0044 Draft. Search field and "New invoice +" pill button. Include an empty-state variant (line-art leaf, "No invoices yet", primary action) and a skeleton loading variant.
```

---

## Batch 2 — Invoices, expenses and approvals

### 6. Invoice detail with partial payment
```text
Invoice detail for INV-0042, client Delta. Hero: centered amount pill "2 000,00 DT" labeled "REMAINING" with attached "+" button (Record payment), ghost text "INV-0042" behind. Under it a progress bar: 1 000 of 3 000 DT paid (33%). Glass card "Payment history" timeline with "1 000 DT — received 05 Nov by Yasmine". Side card with invoice lines, due date (day 20), status chip "Partially paid", actions: "Export PDF" and underlined "Cancel invoice". Show the Record payment dialog as a frosted modal: amount input, date, method, inline validation "Maximum 2 000,00 DT — the invoice cannot be overpaid", primary button "Record payment".
```

### 7. Invoice editor (draft)
```text
Invoice editor in draft status. Two-column layout: left form in glass cards (client selector with Delta, issue date, due date, line items table with description / quantity / unit price / line total, totals block with total "3 000,00 DT"), right live invoice preview paper card. Sticky bottom bar with "Save draft" (secondary), "Validate invoice" (primary pill) and a note "Once validated, changes are made through traceable corrections." Show an inline validation error on an empty line.
```

### 8. Expense submit (Collaborateur)
```text
Mobile-friendly screen for an employee (Sara): "Submit an expense". Simple big form: category chips (Software selected, Travel, Equipment, Training, Other), amount "800,00 DT", date, short description, receipt drop zone with a thumbnail of an uploaded PDF, primary pill button "Submit for approval". A small info line: "Your manager will review it. You'll see the status in My requests." Show success toast variant.
```

### 9. My requests (Collaborateur)
```text
"My requests" screen for the employee. Left floating tabs (All · Submitted · Approved · Refused · Paid). Card list of Sara's expenses only: "Software license 800 DT — Approved", "Train ticket 45 DT — Paid", "Conference pass 350 DT — Refused" with a refusal reason expandable and an underlined link "View details". Status timeline mini-stepper per card (Submitted → Approved/Refused → Paid). Note: no company balance or invoices visible. Empty state variant.
```

### 10. Expense approval queue (Dirigeant)
```text
Expense approval queue for the owner. Glass cards, one per pending expense: "Server hosting + salaries — 6 000 DT, due 25 Nov, requested by Yasmine" and "Software license — 800 DT, requested by Sara". Each card has receipt preview, category chip, and an "Impact" mini-panel showing forecast balance before/after (e.g. "25 Nov: 1 000 DT → 200 DT" for Sara's request and "25 Nov: 7 000 DT → 1 000 DT" for the 6 000 DT request). Buttons: Approve (primary pill), Refuse (clay outline) with a required reason field, and an underlined link "Test in simulator". Left tabs: Pending · Approved · Refused.
```

---

## Batch 3 — Treasury, forecast, simulation, alerts, members

### 11. Treasury ledger
```text
Treasury screen. Hero: real balance "5 000,00 DT" amount pill with ghost text "TREASURY". Below, a balance-history area chart and an airy ledger table of realized movements: opening balance +4 000 (running 4 000); payment received from Delta INV-0042 +1 000 (running 5 000), each with date, label, type chip (Payment in / Expense paid / Correction), amount (green plus / clay minus with ▲▼ icons), running balance. Add a second variant frame showing a Correction row (separate traceable entry with a link icon to the original operation, never deleted). Filter tabs on the left (All · In · Out · Corrections).
```

### 12. Forecast 30/60/90
```text
Forecast screen. Hero: large smooth area/line chart in a glass card with ghost text "FORECAST", pine green solid line, thin sage grid, hover tooltip pill showing date + projected balance, amber marker on the lowest point "Lowest balance: 1 000 DT on 25 Nov" (no shortage in this base forecast), plus a small underlined link "Test a late payment in the simulator". Left floating vertical tabs: 30 · 60 · 90 days. Right panel "How this is calculated": real balance 5 000 + expected receipts 2 000 − planned expenses 6 000 = projected 1 000 DT on 25 Nov, in a clear stepped list, each item linking to its invoice/expense. Mono label "FORECAST · 60 DAYS". Include loading skeleton variant and a text/table alternative toggle for accessibility.
```

### 13. Simulation "What if?" — scenario comparison
```text
"What if?" simulator. Top banner chip: "Simulation — your real data is not modified." Left: scenario builder glass card with hypothesis rows: "Delta pays 20 days late" (toggle + number stepper), "New expense 1 500 DT on day 30" (toggle), "Expected extra income 2 000 DT on day 35" (toggle). Main: comparison chart with base scenario (pine solid line) vs simulated scenario (bio-glow mint dashed line with soft glow), shortage windows shaded in clay, annotation pill "−2 000 DT on day 25". Below, two stat cards side by side: Base (lowest balance 1 000 DT, no shortage) vs Simulated (lowest balance −1 000 DT, shortage days 25–40). Buttons: "Save scenario", underlined "Reset". Side-peeking saved scenario cards cut by the screen edge on the right.
```

### 14. Alerts center
```text
Alerts center. Three grouped glass sections: Overdue invoices (INV-0043 Nova Studio, 12 days late), Expenses to validate (2 pending), Negative forecast (balance projected at −300 DT on 12 Dec in the 60-day horizon). Each alert has an icon, severity chip (never color alone), one-line explanation of the amounts used, and a primary action ("Send reminder", "Review", "Open forecast"). Tabs: All · Unread · Resolved. Calm microcopy. Empty state "All clear — no alerts".
```

### 15. Members & permissions
```text
Company members and permissions screen (owner only). List of members with avatar, name, role chip (Owner, Finance manager, Employee): Karim, Yasmine, Sara. A permissions matrix card with rows (View dashboard, Manage invoices, Record payments, Submit expenses, Approve expenses, View forecast, Run simulations, Manage members) and columns for the three roles using toggle switches/checkmarks (owner row locked). "Invite member +" amount-pill-style button, and an invite dialog with email and role selector.
```

### 16. Clients & suppliers
```text
Clients and suppliers screen with a segmented control (Clients · Suppliers). Left list of contacts, right detail glass card for "Delta": contact details, totals (invoiced 3 000 DT, paid 1 000 DT, outstanding 2 000 DT), history timeline of invoices and payments, underlined link "View all invoices". Add contact button.
```

---

## Mobile variants (generate after desktop is approved)

```text
Create mobile versions (390 px wide) of: Dirigeant dashboard, Invoice detail with partial payment, Expense submit, Forecast, Simulation comparison. Same style. Replace the left floating vertical tabs with a horizontal segmented control at the top, replace the top navigation with a bottom glass tab bar (Home, Invoices, Expenses, Forecast), turn tables into cards, keep one hero element per screen, minimum 44 px touch targets.
```

---

## Refinement prompts (use when a result drifts)

- **Too busy:** "Remove half of the elements on this screen. Keep one hero element and much more whitespace, like an Apple product page."
- **Not nature enough:** "Replace any blue, purple or grey accents with the forest palette (pine #1F6B4E, moss #4E8B63, fern #7FB77E, sage #CFE0CC). Keep clay #C2452B only for negative amounts, overdue and shortage."
- **Too neon / cyberpunk:** "Reduce the glow. Use the mint #6CF5B8 only for focus rings and the simulated scenario line. Everything else calm and soft."
- **Typography off:** "Use Outfit 600 for headings and big numbers, Inter for UI text with tabular numbers, JetBrains Mono uppercase 11px for small labels."
- **Lost the reference structure:** "Re-apply the reference layout: centered hero, giant ghost text behind it at 6% opacity, floating vertical filter tabs on the left edge, amount pill with attached square plus button, underlined secondary link."
- **Not accessible:** "Fix contrast to WCAG AA, add icons and text labels next to every status color, and make all touch targets at least 44 px."
- **Dark theme:** "Generate the dark theme of this screen: background #07130E, translucent forest-green glass cards, text #E8F2EA, stronger but still subtle mint glow."
