---
name: ocp-clean-principles
description: Open/Closed Principle and clean design rules for CashPilot. Use when adding features, refactoring, creating entities/use cases/ports/adapters, or when unsure how to extend behavior without modifying stable code.
---

# OCP and clean design rules for CashPilot

Goal: extend behavior by adding code, not by editing stable, tested code.

## Core rules

- Prefer adding new classes/functions over modifying existing ones.
- Keep entities and use cases closed for modification but open for extension through ports and strategies.
- Put variation behind interfaces (ports), not inside domain logic.
- Use polymorphism/strategy objects instead of long `if/else` or `switch` on types.
- Keep state machines in entities; add new states/transitions by extending the model deliberately, not by patching callers.
- Add new business rules as new domain services or use cases, not as conditionals in UI or controllers.
- Keep adapters replaceable: new storage/PDF/auth provider = new adapter implementing an existing port.

## Practical patterns

- New invoice/payment/expense behavior: add a new use case, do not overload an existing one.
- New alert type: add a new evaluator or rule object, register it, do not edit the alert loop.
- New hypothesis type in simulation: add a new hypothesis class and handler, keep the scenario engine generic.
- New export format: add a new `PdfExporter`/`Exporter` adapter.
- New auth provider: add a new adapter behind `IdentityProvider`/`SessionReader`.
- New currency or display format: handle in `Money`/presentation formatting, not scattered.
- New role/permission: extend the authorization policy object, not every use case condition.

## Anti-patterns to refuse

- Editing a stable entity to add a special case for one feature.
- Adding `if (sector === ...)` or `if (role === ...)` chains across many files.
- Putting feature flags or sector logic in UI components.
- Modifying a port interface for one adapter's convenience.
- Copy-pasting a use case and changing one branch instead of parameterizing/extending.

## Review checklist

- Did this change add a new branch to existing logic? If yes, can it become a strategy?
- Can the new behavior be tested in isolation?
- Did any stable, previously passing test need modification? If yes, justify.
- Is the extension point an interface/port, not a concrete class?
- Are new files named after business concepts, not `utils`/`helpers`?
