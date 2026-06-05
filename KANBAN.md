# Archivum Kanban

## Status language

`Cura` = ready for definition

`In Opere` = in progress

`Recognitio` = under review

`Perfectum` = complete

`Retentum` = deliberately held

## Current board

| Work item | Release | Owner | Status | Acceptance condition |
|---|---|---|---|---|
| Archive doctrine | v0.1 | ChatGPT | Perfectum | Purpose, boundary and lifecycle defined |
| Security baseline | v0.1 | ChatGPT | Perfectum | Private-by-default and no-execution posture defined |
| Agent guardrails | v0.1 | ChatGPT | Perfectum | Repository stop conditions defined |
| Engagement lifecycle | v0.1 | ChatGPT | Perfectum | Start, operate, close, retain and delete defined |
| Retention policy | v0.1 | ChatGPT | Perfectum | Default and contractual overrides defined |
| Exportum standard | v0.1 | ChatGPT | Perfectum | Canonical Markdown and JSON handoff defined |
| Integration architecture | v0.1 | ChatGPT | Perfectum | Generation, storage and adapter boundaries defined |
| Client repository standard | v0.1 | ChatGPT | Perfectum | One-client-one-repo structure defined |
| Operator runbook | v0.1 | ChatGPT | Perfectum | Manual operating lifecycle documented |
| Information classification | v0.1 | ChatGPT | Perfectum | Four handling classes defined |
| Client home template | v0.1 | ChatGPT | Perfectum | Client can browse artefacts from one landing page |
| Artefact manifest | v0.1 | ChatGPT | Perfectum | Ownership, version, classification and source captured |
| Engagement metadata | v0.1 | ChatGPT | Perfectum | Engagement identity and lifecycle data structured |
| Governance record | v0.1 | ChatGPT | Perfectum | Context, outcome and actions captured |
| Closeout template | v0.1 | ChatGPT | Perfectum | Handover, access and retention recorded |
| Repository ignore rules | v0.1 | ChatGPT | Perfectum | Common secrets, local work and archives excluded |
| Template consistency review | v0.2 | Codex | Cura | Links, placeholders, JSON validity and field consistency validated |
| Repository scaffold automation | v0.3 | Claude | Retentum | Only after manual pattern is proven |
| GitHub write integration | v0.4 | Claude and Codex | Retentum | Requires explicit security and authentication design |

## Release gates

Archivum v0.1 is complete. The repository is usable manually without code, dependencies, automation, or external services.

Archivum v0.2 is a precision review only. It must not introduce application code or automation.

Archivum v0.3 begins only after a simulated engagement validates the manual structure and the Founder / CTO approves automation.
