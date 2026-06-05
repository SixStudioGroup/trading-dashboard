# Integration Architecture

Archivum is the default secure archive when a client does not provide an approved enterprise repository. It is also the portable handover layer when a client does use external systems.

The architecture separates generation, canonical packaging, storage, and integration.

| Layer | Responsibility |
|---|---|
| Product layer | Valour, EA, SA, BA, PMO and future products generate artefacts |
| Exportum layer | Converts outputs into canonical Markdown, JSON and rendered formats |
| Archivum layer | Stores controlled engagement records in a private client repo |
| Adapter layer | Publishes or synchronises packages into approved enterprise tools |
| Enterprise layer | Jira, Confluence, SharePoint, Google Drive, Notion, Azure DevOps or client systems |

## Design rule

Ordo Animi should orchestrate work but should not rebuild mature enterprise platforms.

The estate owns cognition, guidance, artefact generation, semantic consistency, orchestration, and portable handoff. External systems own collaboration, work tracking, records management, identity, and infrastructure where the client has adopted them.

## Adapter priorities

Future adapters should be considered in this order: GitHub, Confluence, Jira, SharePoint, Azure DevOps, Google Drive, Notion, and object storage. Priority may change according to client demand.

## Security boundary

Adapters must use client-approved credentials and least privilege. Credentials must never be stored in an Archivum repo. Every automated write must record target, time, source artefact, result, and operator or service identity.

## Offline fallback

The canonical export package remains the fallback. If an integration is unavailable, the user can download or transfer the artefact without losing structure or metadata.
