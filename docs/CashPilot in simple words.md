# CashPilot in simple words

Summary of the CashPilot project idea: what it is, the problem it solves, its objectives, who it is for, and example scenarios for each role.

## What it is

CashPilot is a web app where a small business tracks its **real money** (what is actually in the bank) and **predicts its future money** (what will be there in 30, 60 or 90 days), so it sees cash problems before they happen.

## The problem it solves

A company can be profitable on paper and still go bankrupt, because **sales are not cash**. You can issue a 3,000 DT invoice today and still have to wait weeks to get paid, while salaries and rent are due now. Small businesses usually track this in scattered spreadsheets, so they only notice the shortage when the account is already empty.

CashPilot connects invoices, payments received, expenses and due dates in one place, so the company can see trouble coming and test decisions before making them.

## Objectives

1. **Track real cash:** starting balance plus every payment and expense that actually happened.
2. **Forecast:** project the balance at 30, 60 and 90 days from unpaid invoices and planned expenses.
3. **Simulate "What if?":** change assumptions in a separate scenario (a client pays late, a new expense appears) and compare it with the base forecast, without touching real data.
4. **Control spending:** employees submit expenses and the boss approves or refuses them.
5. **Alert early:** overdue invoices, expenses waiting for approval, and a forecast balance that goes negative.

## Who it is designed for

Small businesses such as a digital agency, a training center, a shop or a service company. Three kinds of people use it:

- **Dirigeant (owner/boss):** wants the big picture and approves spending.
- **Gestionnaire financier (finance manager):** does the daily work: invoices, payments, forecasts.
- **Collaborateur (employee):** only submits expense requests and follows their status.

## Example scenarios by role

One fictional company is used throughout: **Atelier Pixel**, a digital agency, starting with **5,000 DT** in the bank. These numbers are only for illustration.

### Gestionnaire financier (the main user)

1. Creates a **3,000 DT invoice** for client Delta, due on day 20. It starts as a draft, then she validates it. She can export it as a PDF.
2. Delta pays **1,000 DT** early. She records a partial payment, and the invoice now shows **2,000 DT remaining**. If she tried to record 2,500 DT, the app would refuse, because an invoice can't be paid beyond what's left.
3. She opens the **forecast** and sees the balance at 30/60/90 days, based on the unpaid 2,000 DT and the planned expenses.
4. She runs a **simulation**: "What if Delta pays 20 days late?" The dashboard now shows a period where the balance goes negative, with the amounts and assumptions that explain it.
5. Her dashboard shows alerts: one overdue invoice and one negative forecast period.

### Collaborateur (employee)

1. Sara needs a software license and submits an **expense**: category "Software", 800 DT, date, receipt attached. Status: *submitted*.
2. She opens "My requests" and sees only her own expenses and their status.
3. The next day it shows **approved**, then later **paid**. If it had been **refused**, she'd see that, and nobody could record it as paid.
4. She cannot see the company's balance, invoices or forecast.

### Dirigeant (owner/boss)

1. Opens the dashboard and sees the real balance, the forecast, overdue invoices and expenses waiting for his approval.
2. Reviews Sara's 800 DT request. Before approving, he checks the forecast: the balance stays positive, so he **approves** it. For a larger, risky request (say 6,000 DT), he can check the simulation first, then **refuse** it or ask to delay it.
3. Looks at the "client pays 20 days late" simulation and decides to chase Delta or postpone a purchase before the shortage hits.
4. Manages who belongs to the company and what each member is allowed to do.

## How the money story plays out

|  | Normal case | Delta pays 20 days late |
| --- | --- | --- |
| Start balance | 5,000 DT | 5,000 DT |
| Day 20 | +3,000 DT received → 8,000 DT | nothing received → 5,000 DT |
| Day 25 | −6,000 DT expenses → **2,000 DT** | −6,000 DT expenses → **−1,000 DT** |
| Day 40 | 2,000 DT | +3,000 DT received → 2,000 DT |

In the late-payment scenario the company is short of cash between day 25 and day 40, even though it ends up fine. That gap is what CashPilot is built to show in advance.

## What the course expects to see in the demo

Create a company with a starting balance → issue an invoice → record a partial payment → submit and approve an expense → view the forecast → simulate a late payment → compare the two scenarios.
