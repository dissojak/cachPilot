---
name: atomic-push
description: Creates one atomic commit and pushes it following CashPilot team branch rules. Requires a team member name. Use when the user asks to commit/push/save work.
---

# Atomic push skill

This skill creates a single, reviewable commit and pushes it. It must never guess the contributor name.

## Required input

- The user must provide a team member name.
- If no name is provided, stop and ask: "Which team member is pushing? (example: Adem)"
- Do not default to `Adem`, `main`, or any other value.

## Commit message format

`<Name>: <short imperative summary>`

Examples:
- `Adem: add invoice payment use case`
- `Sara: fix expense approval transition`

## Branch rules

- If the name is `Adem` (case-insensitive): push to `main`.
- For any other name: push only to that member's branch.
  - If currently on `main`, create or switch to `feat/<name-lowercase>` before committing.
  - If already on a non-`main` branch, use the current branch.
  - Never push a non-Adem contributor to `main`.

## Atomic commit procedure

1. Ask for the contributor name if missing.
2. Run `git status` and `git diff`.
3. Stage only the files that belong to the current logical change. Do not use `git add .` blindly.
4. Run checks before committing only when application code exists and the tools are available:
   - `pnpm turbo run lint typecheck test`
   - `pnpm depcruise`
   - For docs/config-only changes, skip these checks and say so.
5. If checks fail, fix the code or ask the user. Do not disable rules.
6. Create the commit with the required message format.
7. Push:
   - `Adem`: `git push origin main`
   - other: `git push origin HEAD` on the member branch
8. If the push fails, report the error and do not force-push.

## Post-push team tracking

After a successful push, update the team tracking file so completed work is recorded.

- Tracking file: `docs/TEAM-WORK-DISTRIBUTION.md`.
- In the same logical change, or immediately after the successful push, mark the completed item(s) as done in that file.
- Use a clear status such as `Done` or `✅` next to the completed work item.
- If the tracking update requires its own commit, use the same contributor name and a message like `<Name>: mark <work item> done`.
- Push the tracking update using the same branch rules as the code commit.

## Rollback rules

If any step fails, do not leave the repository in a half-finished state.

- If checks fail before commit: stop, fix the code, and leave files unstaged or restored as needed.
- If the commit is created but the push fails: reset the local commit with `git reset --soft HEAD~1`, unstage the files, and restore `docs/TEAM-WORK-DISTRIBUTION.md` to its previous state.
- If the push succeeds but the team-tracking update fails: report the failure, keep the code push intact, and create a follow-up commit for the tracking update.
- If the tracking update is included in the same commit and that commit fails to push: reset the commit and restore both code and tracking file changes.
- Never use force-push.
- Never amend a failed commit; create a new commit after fixing the issue.

- One logical change per commit.
- Do not amend a failed commit; create a new commit.
- Do not push secrets or generated dependency folders.
- Do not push if the contributor name is unknown.
- For non-Adem contributors, refuse to push to `main` even if requested.
EOF
echo done