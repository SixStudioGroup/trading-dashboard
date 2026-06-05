# Exportum Handoff Standard

Exportum defines how artefacts leave estate products and enter client systems or Archivum.

## Canonical outputs

Every material artefact should support Markdown and JSON. Where presentation matters, it should also support print or PDF-ready output. Copy-to-clipboard is a convenience, not the canonical record.

## Canonical package

A handoff package contains the artefact, a manifest, and any referenced attachments.

Recommended naming:

`YYYY-MM-DD-domain-title-version.ext`

Example:

`2026-06-06-solution-architecture-integration-pattern-v1.0.md`

## Required manifest fields

| Field | Purpose |
|---|---|
| artefact_id | Stable identifier |
| title | Human-readable title |
| domain | Enterprise, business, solution, delivery, leadership, or other approved domain |
| source_product | Producing product such as Valour or SA Artefact Generator |
| engagement | Client or engagement identifier |
| author | Human owner or accountable operator |
| created_at | Creation timestamp |
| updated_at | Last material update |
| version | Controlled version |
| status | Draft, Review, Approved, Superseded, or Archived |
| classification | Public, Internal, Confidential, or Restricted |
| source_context | Optional origin reference |
| checksum | Optional integrity value for later automation |

## Target adapters

The first release remains tool-neutral. Later adapters may target GitHub, Confluence, Jira, SharePoint, Google Drive, Notion, Azure DevOps, S3, or other approved systems.

Adapters must transform the canonical package; they must not redefine the source artefact model.

## Portability rule

An artefact is not complete if it can only be read inside the application that generated it.
