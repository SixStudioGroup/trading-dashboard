# Archivum

Archivum is the secure engagement archive pattern for the Ordo Animi and Velocity Architecture estate.

It provides one private repository per client or engagement, one access boundary, one controlled artefact lifecycle, and one final handover package. Archivum is not an application runtime, ticketing system, content management system, or replacement for Jira, Confluence, SharePoint, Google Drive, or other enterprise systems. It is the default secure archive when a client does not already have an approved repository.

## Operating model

A new private repository is created at the start of an engagement from the Archivum template. Client artefacts are stored as portable files, primarily Markdown and JSON, with PDF-ready exports where required. At engagement close, the repository is reviewed, frozen, exported, handed over, retained for the contracted period, and then archived or deleted according to client instruction.

The security boundary is repository-level. Client folders must not be mixed inside one shared repository.

## Canonical lifecycle

`Constitutio -> Operatio -> Recognitio -> Traditio -> Retentio -> Clausura`

In plain English: establish, operate, review, hand over, retain, close.

## Repository contents

| Path | Purpose |
|---|---|
| `docs/` | Governance, lifecycle, security, export and operating doctrine |
| `templates/` | Reusable engagement and artefact templates |
| `examples/` | Placeholder-only example structures |
| `KANBAN.md` | Release and work sequencing |
| `AGENTS.md` | AI-agent constraints and repository boundaries |
| `SECURITY.md` | Security posture and reporting rules |

## Current release

Archivum v0.1 establishes the secure doctrine, client archive structure, export standard, release plan, and operational controls. It intentionally contains no executable application code, package manager, CI workflow, external dependency, API token, or client data.

## Ownership

Founder / CTO: ZenCloudAU

Architecture and product control: Ordo Animi

Public framework and master templates: Velocity Architecture

Client-specific completed artefacts: one private Archivum repository per engagement
