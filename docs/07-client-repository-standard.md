# Client Repository Standard

Each client or engagement receives a separate private repository created from the Archivum foundation.

## Required top-level files

The repository must contain a client-facing `README.md`, `SECURITY.md`, `AGENTS.md`, an engagement metadata file, and the approved domain folders.

## Required domain folders

The standard structure is:

```text
00-index/
01-enterprise-architecture/
02-business-architecture/
03-solution-architecture/
04-delivery-and-pmo/
05-governance-records/
06-workshops/
07-reports/
08-exports/
09-archive/
```

Unused folders may remain empty. Domain folders may be extended only when the engagement requires it and the client home page is updated.

## Repository naming

Use a neutral identifier rather than sensitive client detail where practical.

Recommended pattern:

`archivum-[client-slug]-[engagement-slug]`

## Access

The Founder / CTO or named engagement owner remains repository administrator. Client participants receive only the access necessary to browse or contribute. Access changes are recorded in the engagement closeout or access log.

## Artefact status

Controlled artefacts use one of five states: Draft, Review, Approved, Superseded, or Archived.

Superseded material moves to `09-archive/` or is clearly marked and linked to its replacement.

## Public templates

Public baseline templates remain in Velocity Architecture. Completed client artefacts remain in the client Archivum repository. Client content must never be copied into public templates.
