---
name: CashPilot
version: 0.1
description: Calm, glassy, Apple-like fintech interface with a futuristic forest identity.
colors:
  # Light theme (default)
  fog-50:        "#F5F8F3"   # page background top
  mist-100:      "#E9F0E6"   # page background bottom / subtle fills
  sage-200:      "#CFE0CC"   # borders, dividers on tinted areas, chart grid
  fern-400:      "#7FB77E"   # positive / income (light accents)
  moss-500:      "#4E8B63"   # positive / income (text-safe on white at large sizes)
  pine-600:      "#1F6B4E"   # PRIMARY (buttons, active states, base forecast line)
  forest-800:    "#123A2B"   # deep surfaces, dark cards
  forest-900:    "#0B1F17"   # ink / primary text
  bio-glow:      "#6CF5B8"   # futuristic accent: glow, focus ring, simulated scenario
  sun-amber:     "#E3A857"   # warning (invoice due soon, pending approval)
  clay:          "#C2452B"   # danger / negative balance / overdue (AA with white text)
  lake:          "#6FA8B8"   # info
  text-primary:   "#0B1F17"
  text-secondary: "#4A6256"
  text-tertiary:  "#7C8F83"
  # Dark theme
  dark-bg:       "#07130E"
  dark-surface:  "rgba(18,58,43,0.55)"
  dark-text:     "#E8F2EA"
typography:
  display: { family: "Outfit", weights: [500, 600, 700], tracking: "-0.03em" }
  ui:      { family: "Inter",  weights: [400, 500, 600], features: "tnum, cv11" }
  mono:    { family: "JetBrains Mono", weights: [400, 500], transform: "uppercase", tracking: "0.12em", use: "tiny technical labels" }
  accent-alt: { family: "Fraunces", style: "italic", use: "optional single hero word only" }
rounded: { card: 28, inner: 20, input: 16, pill: 999 }
spacing: { base: 8, scale: [4, 8, 12, 16, 24, 32, 48, 64, 96] }
---

# CashPilot — Design System

## 1. Visual theme and atmosphere

**One sentence:** *a calm forest at dawn, seen through frosted glass — quiet, spacious and precise like an Apple product, with a faint bioluminescent, futuristic glow.*

Money software is usually stressful. CashPilot should feel the opposite: **calm, clear, in control**. Nature colors reduce anxiety; Apple-style restraint keeps numbers readable; small futuristic touches (glow, contour lines, mono labels) make it feel modern.

### What to borrow from the reference screenshot (CPJ juice shop)

The reference is a minimal product page. Keep its *structure and attitude*, not its colors:

- **One hero element, centered**, surrounded by a lot of empty space.
- **Giant ghost typography behind the hero** (the huge "SHIFT1" behind the bottle). In CashPilot: the page/section word or the main amount in huge type at ~6–8 % opacity behind the main chart or balance.
- **Soft, almost monochrome tinted background** (light lavender-grey there; misty sage here) with soft shadows under objects.
- **Centered top navigation**: links left and right of a centered logo; a small solid "SIGNUP"-style button at the far right.
- **Floating vertical filter tabs on the left edge** (Juices / Shots / Packs / All) with one active tab in the accent color. In CashPilot they filter: forecast horizon (30 / 60 / 90 days), invoice status (All / Draft / Sent / Overdue / Paid), expense status.
- **Price pill with a square "+" button attached** (`£3.99 | +`). In CashPilot: amount pill with an action button (`2 000 DT | +` to record a payment / add an operation).
- **Underlined text link** ("More info") as the secondary action instead of a heavy button.
- **Tiny footer links** and a copyright line; extra detail stays out of the way.
- **Side-peeking items** (neighbouring bottles cut by the screen edge) → use for horizontally scrolling scenario cards / company switcher.

## 2. Color usage

| Purpose | Color | Notes |
|---|---|---|
| Page background | gradient `fog-50 → mist-100` + blurred canopy blobs in `sage-200` and `fern-400` at 20–30 % | Never flat white. |
| Cards | white at 65 % + backdrop-blur 24 px, 1 px border white 60 % | "Frosted glass". |
| Primary action | `pine-600`, white text | Pills, 48 px high. |
| Active filter / selected tab | `pine-600` fill (or `clay` accent for the quick-add "+" like the reference) | One accent per screen region. |
| Positive money (income, balance up) | `moss-500` text / `fern-400` fills | Always with + sign or ▲ (not color alone). |
| Negative money, overdue, shortage | `clay` | Shortage zones in charts: `clay` at 12 % fill. |
| Warning (pending approval, due soon) | `sun-amber` | |
| Base forecast line | `pine-600`, solid, 3 px | |
| **Simulated scenario line** | `bio-glow`, dashed, soft glow | The "what-if" hologram. Appears only in simulation views. |
| Focus ring | `bio-glow` 2 px + 4 px 25 % halo | |
| Dark mode | `dark-bg`, glass `dark-surface`, text `dark-text`, `bio-glow` glow stronger | Provide both themes. |

Rules: text contrast ≥ 4.5:1 (large text ≥ 3:1). Never rely on color alone for status — pair with icon + label. Keep `bio-glow` rare (≤ 5 % of the screen).

## 3. Typography

- **Display / big numbers:** *Outfit* 600, tracking −3 %. Rounded geometric shapes feel organic and futuristic at once.
- **UI / body:** *Inter* (closest free equivalent to Apple's SF Pro). Always enable tabular numbers (`font-variant-numeric: tabular-nums`) for amounts and tables.
- **Tiny labels:** *JetBrains Mono* uppercase, 11 px, tracking 12 % (e.g. `FORECAST · 60 DAYS`).
- **Optional editorial accent:** *Fraunces* italic for a single word in a hero (e.g. "Navigate your *cash*"). Never for data.
- If Stitch cannot load a font, fall back to: Display → *Sora* or *Manrope*; UI → system `-apple-system, "SF Pro Text", Inter`.

| Role | Size / line | Weight |
|---|---|---|
| Hero amount | 72 / 72 (mobile 48) | Outfit 600 |
| H1 | 40 / 44 | Outfit 600 |
| H2 | 28 / 34 | Outfit 600 |
| H3 | 20 / 28 | Inter 600 |
| Body | 16 / 24 | Inter 400 |
| Caption | 13 / 18 | Inter 500 |
| Mono label | 11 / 14 | JetBrains Mono 500 |

Currency format: `2 000,00 DT` (space as thousands separator, comma decimal) if the UI is French; `2,000.00 DT` if English. Store money as integers (millimes) — display formatting only.

## 4. Shape, depth, background

- Radius: cards 28, inner blocks 20, inputs 16, buttons/chips/tabs = full pill.
- Shadows are soft and tinted green-black: `0 20px 60px -20px rgba(11,31,23,.25)`; never harsh grey.
- Glass: `backdrop-filter: blur(24px) saturate(140%)`, border `1px solid rgba(255,255,255,.6)`, inner highlight on top edge.
- Background decoration (low opacity, max one per screen): blurred "canopy" gradients; faint **topographic contour lines** (4–6 % opacity) for the futuristic-nature feel; optional subtle grain.
- Spacing on an 8-pt grid; generous whitespace — if a screen feels full, remove something.

## 5. Motion

- Spring-like easing (`cubic-bezier(.2,.8,.2,1)`), 200–400 ms.
- Numbers count up on load; forecast line **draws itself** left to right; simulated line fades in with a soft glow pulse once.
- Hover: slight lift (translateY −2 px) + shadow growth. Press: scale .98.
- Respect `prefers-reduced-motion`: disable count-up, draw and pulse.
- Max **one** attention-grabbing animation per screen.

## 6. Components

**Top nav (floating glass bar):** logo centered, 2 links each side (e.g. Dashboard · Invoices | Forecast · Expenses), company switcher + avatar right, small solid "+ New" button.

**Side filter tabs (vertical, floating on the left edge):** white pills stacked, selected one filled `pine-600`. Collapses to a horizontal segmented control on mobile.

**Amount pill + action:** white rounded rectangle with the amount (tabular, bold) joined to a square accent button with "+" (or arrow). Used for balance, invoice remaining amount, expense amount.

**Stat tiles:** glass card, mono label, big Outfit number, small delta chip (▲ +12 %).

**Charts:** area/line with soft gradient fill, thin grid in `sage-200`, tooltips as frosted pills. Shortage periods highlighted with clay 12 % bands and an icon marker. Scenario comparison: base (pine, solid) vs simulated (bio-glow, dashed) + legend + difference chip ("−3 000 DT on day 25").

**Tables / lists:** airy rows, no heavy borders, hover row tint `mist-100`, status chips, sticky header. Rows become cards on mobile.

**Status chips:** Draft (grey-green), Sent (lake), Partially paid (amber), Paid (moss), Overdue (clay), Cancelled (grey, strikethrough amount). Expense: Submitted (lake), Approved (moss), Refused (clay), Paid (pine).

**Forms:** large inputs (56 px) with floating labels, inline validation messages (icon + text), currency input with right-aligned tabular numbers, date pickers as frosted popovers, file drop zone for receipts.

**Feedback states (every data screen must design all four):** loading (skeleton shimmer in sage tones, organic leaf spinner for button loading), empty (simple line-art leaf/branch + one sentence + primary action), error (calm clay card + retry), success (toast, frosted, bio-glow check).

**Underlined link:** secondary action ("More details", "View history") like the reference's "More info".

## 6b. Using uiverse.io elements

uiverse.io is a community library of open-source UI elements (copyable as HTML/CSS, Tailwind, React; free for personal and commercial use, but check each element's page for its license/author). Browse these collections and **restyle every element to the tokens above** (colors, radius, fonts):

| Need in CashPilot | uiverse.io collection to browse |
|---|---|
| Buttons (primary, pill+plus, subtle glow on hover) | Button Effects |
| Glass cards, dashboard panels, stat tiles | Card Components, Modern Styles (glassmorphism) |
| Inputs, switches (e.g. dark mode, "include in forecast"), checkboxes, radios | Forms & Inputs |
| Skeletons, button loaders, leaf-like spinner | Loading UI |
| Tooltips for chart points and help hints, background patterns | Tooltips & Patterns |

Rules: avoid neon/cyberpunk looks; keep to our palette; one animated flourish per screen; every element must keep keyboard focus + contrast; **record each element's name, author and URL** in the README under "External resources" (the course requires declaring external resources and AI tools).

## 7. Layout and responsiveness

- Desktop: max content width 1200 px, 12-column grid, 32 px gutters. Mobile-first: single column, bottom tab bar with 4 items (Home, Invoices, Expenses, Forecast), side tabs become top segmented control, tables become cards.
- Hero zone at top of each main screen (like the reference product): one big number or chart centered, with the ghost typography behind it.

## 8. Accessibility

Contrast AA minimum, visible focus ring (`bio-glow`), 44 px minimum touch targets, labels on all inputs, status never by color alone, charts have a text summary and a data table alternative, full keyboard navigation, reduced-motion support.

## 9. Brand

- Name: **CashPilot**. Logo idea: a leaf whose midrib is a compass needle (nature + navigation); wordmark in Outfit 600.
- Voice: calm, clear, reassuring. Say "Your balance may dip below zero on 25 Nov" — not "WARNING: INSUFFICIENT FUNDS".
- Tagline options: "See your cash before it moves." · "Navigate your cash with calm."

## 10. Do / Don't

**Do:** whitespace, one hero per screen, big readable numbers, frosted glass, soft green shadows, clear status chips, calm microcopy.
**Don't:** flat white backgrounds, harsh black borders, rainbow charts, neon overload, more than one accent color per area, dense tables on mobile, red/green as the only signal.
