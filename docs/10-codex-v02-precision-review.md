# Codex Brief: Archivum v0.2 Recognitio

## Objective

Perform a precision consistency review of the Archivum v0.1 foundation without changing product scope.

## Allowed work

Codex may inspect Markdown and JSON files, validate links and placeholders, compare naming and lifecycle terms, identify contradictions, and make small corrective edits.

## Required checks

- Validate all JSON templates parse correctly.
- Confirm lifecycle terms are consistent across README, doctrine, runbook, closeout, and Kanban.
- Confirm information-classification labels are consistent.
- Confirm source-product, version, status, owner, and engagement fields align across Markdown and JSON templates.
- Confirm file references in README and docs point to real files.
- Confirm the one-client-one-private-repo boundary is stated consistently.
- Confirm no package manager, workflow, dependency, executable script, deployment file, or credential exists.
- Confirm no real client information appears anywhere.
- Confirm `.gitignore` covers common secret and local-working patterns without hiding canonical templates.
- Identify any duplicate, ambiguous, or missing fields.

## Exclusions

Do not add application code, shell scripts, GitHub Actions, external dependencies, automation, authentication, cloud storage, Jira or Confluence integration, or new product features.

Do not rename Archivum, Ordo Animi, Valour, Custos, Velocity Architecture, or lifecycle terms.

Do not alter repository visibility or settings.

## Acceptance criteria

The repository remains documentation-only and manually usable. All structured files are valid. The documentation is internally consistent. Any edits are minimal and directly tied to a discovered defect.

## Completion report

Report files reviewed, defects found, files changed, validation performed, unresolved questions, and whether Archivum v0.2 can be marked `Perfectum`.
