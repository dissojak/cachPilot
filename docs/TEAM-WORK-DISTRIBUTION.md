# CashPilot — Work Distribution

Recommended split: **Adem 60%**, **Teammate B 20%**, **Teammate C 20%**.  
The 50/25/25 split is also acceptable, but 60/20/20 is recommended because Phase 1 preparation and the core money/payment rules are heavy.

Percentages are effort estimates, not exact hours. Replace `Teammate B` and `Teammate C` with real names.

## Ownership summary

| Person | Share | Main responsibility |
|---|---:|---|
| Adem | 60% | Architecture, backend preparation, core domain, shared schema/ports, critical slices, integration, delivery |
| Teammate B | 20% | Supporting feature slices and UI |
| Teammate C | 20% | Supporting feature slices, forecast/simulation, tests |

## Detailed distribution

| Work item | Estimated effort | Owner |
|---|---:|---|
| Phase 1: MongoDB connection and typed env | 4% | Adem |
| Phase 1: rich Mongoose schemas and indexes | 8% | Adem |
| Phase 1: domain model, state machines, errors | 7% | Adem |
| Phase 1: ports and adapter boundaries | 4% | Adem |
| Phase 1: Auth.js OAuth setup | 3% | Adem |
| Phase 1: shared Server Action/Zod pattern | 2% | Adem |
| Phase 1: logging and audit shape | 2% | Adem |
| Phase 1: seed/demo data plan | 2% | Adem |
| Slice 1: auth, company, dashboard shell | 9% | Adem |
| Slice 2: parties | 4% | Teammate B |
| Slice 3: invoices and partial payments | 12% | Adem |
| Slice 4: expenses and approval | 9% | Teammate B |
| Slice 5: cash | 5% | Adem |
| Slice 6: forecast | 7% | Teammate C |
| Slice 7: alerts | 4% | Adem |
| Slice 8: simulation | 8% | Teammate C |
| Slice 9: recurring retainers | 6% | Teammate B |
| Phase 3: tests and E2E | 6% | Shared (Adem 3%, B 1.5%, C 1.5%) |
| Phase 3: guard rails and CI | 2% | Shared (Adem 1%, B 0.5%, C 0.5%) |
| Phase 3: Vercel deployment | 2% | Adem |
| Phase 3: README and demo data | 2% | Shared (Adem 1%, B 0.5%, C 0.5%) |

Approximate totals:
- Adem: 60%
- Teammate B: 20%
- Teammate C: 20%

## Execution order

Work is sequential by ownership, not parallel:

1. Adem completes their 60% first.
2. Teammate B starts only after Adem reaches 60%.
3. Teammate C starts only after Teammate B reaches their 20%.
4. No one waits idle: when one person finishes their share, the next person starts immediately.
5. Shared work (tests, CI, README) is done by whoever is active at that point, with Adem reviewing.

This means Adem owns the foundation and critical slices first; teammates then extend the already-prepared base.

- Adem owns the shared schema, ports and core money/payment rules. Teammates should extend these, not recreate them.
- Each feature owner implements the full vertical slice: domain, use cases, infra, UI, tests.
- Shared files (schema, ports, layout, config) require review from Adem before merge.
- Every change goes through a feature branch and pull request.
- Commit messages use the contributor name: `Name: short imperative summary`.
- Adem pushes to `main`; teammates push only to their own branches.
- If a 20% share is too large for a teammate, move one slice to Adem and reduce that teammate to 15%.

## Suggested branch names

- `feat/adem-phase1-preparation`
- `feat/adem-invoices-payments`
- `feat/adem-cash-forecast-alerts`
- `feat/teammate-b-parties-expenses-retainers`
- `feat/teammate-c-forecast-simulation`
EOF
echo done
## Status

- Adem: 60 0.000000oundation complete and pushed.

- Adem: auth integration and pages complete.
