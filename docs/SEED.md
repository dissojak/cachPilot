# CashPilot — Seed and Demo Data Plan

Demo data must support the defense scenario end to end.

## Demo users

- Owner: `owner@cashpilot.demo`
- Finance manager: `finance@cashpilot.demo`
- Collaborator: `collab@cashpilot.demo`

## Demo company

- Name: `Atlas Studio`
- Sector: digital agency
- Opening balance: `5 000,000 DNT` (5 000 000 millimes)
- Forecast threshold: `1 000,000 DNT`

## Demo parties

- `Acme Client` — customer
- `Globex Corp` — customer
- `Office Supplies Co.` — supplier

## Demo invoices

1. Invoice `INV-001`
   - Customer: Acme Client
   - Total: `3 000,000 DNT`
   - Due date: 10 days after seed date
   - Status: validated
   - Payment: `1 000,000 DNT` partial payment already recorded

2. Invoice `INV-002`
   - Customer: Globex Corp
   - Total: `4 500,000 DNT`
   - Due date: 25 days after seed date
   - Status: validated
   - Payment: none

3. Invoice `INV-003`
   - Customer: Acme Client
   - Total: `1 200,000 DNT`
   - Status: draft

## Demo expenses

1. `Office rent`
   - Amount: `2 000,000 DNT`
   - Status: approved
   - Planned payment date: 15 days after seed date

2. `Software subscription`
   - Amount: `400,000 DNT`
   - Status: submitted
   - No approval yet

3. `Team lunch`
   - Amount: `120,000 DNT`
   - Status: refused

## Demo cash movements

- Opening balance movement: `5 000,000 DNT`
- Invoice payment movement: `1 000,000 DNT`
- Approved expense payment movement: `2 000,000 DNT`

## Demo scenario

- Name: `Client pays 20 days late`
- Hypothesis: delay `INV-002` by 20 days
- Expected result: shortage window appears around the rent payment date

## Seed rules

- Seed data must be company-scoped.
- Seed must be idempotent.
- Seed must create demo accounts for all three roles.
- Seed must support the defense scenario without manual edits.
