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
| Engagement lifecycle | v0.1 | ChatGPT | In Opere | Start, operate, close, retain and delete defined |
| Retention policy | v0.1 | ChatGPT | In Opere | Default and contractual overrides defined |
| Exportum standard | v0.1 | ChatGPT | In Opere | Canonical Markdown and JSON handoff defined |
| Client home template | v0.1 | ChatGPT | In Opere | Client can browse artefacts from one landing page |
| Artefact manifest | v0.1 | ChatGPT | In Opere | Ownership, version, classification and source captured |
| Decision record | v0.1 | ChatGPT | Cura | Decision context and approval captured |
| Closeout template | v0.1 | ChatGPT | Cura | Handover, access and retention signed off |
| Template consistency review | v0.2 | Codex | Retentum | Schemas and links validated after v0.1 completion |
| Repository scaffold automation | v0.3 | Claude | Retentum | Only after manual pattern is proven |
| GitHub write integration | v0.4 | Claude and Codex | Retentum | Requires explicit security and authentication design |

## Release gates

Archivum v0.1 is complete when the repo is usable manually without code, dependencies, automation, or external services.

Archivum v0.2 begins only after a simulated engagement validates the structure.

Archivum v0.3 begins only if repeated manual setup proves automation is valuable.
