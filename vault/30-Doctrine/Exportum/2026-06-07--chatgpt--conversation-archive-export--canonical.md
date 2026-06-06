---
id: "c5db10bf-e95a-4f59-8e32-b9a688a63f3d"
title: "Conversation Archive Export"
created_at: "2026-06-07"
updated_at: "2026-06-07"
source_platform: "ChatGPT"
source_thread: "Automated archivist export request"
classification: "Internal"
status: "Draft"
domains:
  - VALOR
  - Astra
tags:
  - conversation-archive
  - markdown-export
  - git-patch
  - obsidian
  - archival-routing
products:
  - Exportum
  - Archivum
---

# Purpose

Define a deterministic method for exporting a conversation into an Obsidian vault as three new Markdown files delivered through a unified Git diff.

# Current state

The export package consists of a canonical note, a reusable prompt library, and a verbatim transcript. It is routed to `vault/30-Doctrine/Exportum/` because its primary concern is packaging, handoff, and export structure.

The export date is `2026-06-07` in Australia/Brisbane.

# Constraints and boundaries

The export creates exactly three new files in one destination folder.

Filing decisions, filenames, source-platform naming, and the thread slug are resolved without operator input.

The canonical note removes conversational noise while preserving material decisions, constraints, rules, risks, and uncertainties.

The transcript preserves the available user-visible conversation verbatim.

Facts not established by the conversation are not invented. Uncertainty is stated explicitly.

# Key decisions (with rationale)

The destination is `vault/30-Doctrine/Exportum/` because the request is principally an export and handoff operation.

The source platform is recorded as `ChatGPT`, with `chatgpt` used in filenames for a filesystem-safe lowercase convention.

The slug is `conversation-archive-export` because it describes the thread's operative purpose without relying on an unspecified external project name.

Dates are recorded without fabricated clock times because the conversation establishes the date but not the exact current time.

# Definitions and glossary

**Canonical note:** A cleaned, structured representation of the conversation's durable operational content.

**Prompt library:** A deduplicated collection of reusable, platform-agnostic prompts derived from the conversation.

**Transcript:** The raw user-visible conversation preserved verbatim.

**Unified diff:** A Git-compatible patch format containing file paths, file modes, and added content.

**Routing:** Selection of one doctrine folder according to the primary function of the exported material.

# Architecture/components mentioned

The export architecture has three components: canonical knowledge, reusable prompting, and evidentiary transcript.

The delivery mechanism is a Git-compatible patch or direct repository write.

The storage target is an Obsidian vault within `ZenCloudAU/obsidian-vault`.

# Artefacts/files/repos mentioned

Repository: `ZenCloudAU/obsidian-vault`

Base path: `vault/`

Selected destination: `vault/30-Doctrine/Exportum/`

Generated artefacts:

- `2026-06-07--chatgpt--conversation-archive-export--canonical.md`
- `2026-06-07--chatgpt--conversation-archive-export--prompts.md`
- `2026-06-07--chatgpt--conversation-archive-export--transcript.md`

# Operating doctrine/rules

Choose exactly one destination folder based on the dominant function of the conversation.

Create exactly three new files using the prescribed date, platform, slug, and suffix convention.

Use Obsidian-ready Markdown and valid YAML frontmatter.

Preserve evidence in the transcript while reducing noise in the canonical note.

Rewrite reusable prompts so they are platform-agnostic and deduplicated.

# Risks and unknowns

The exact external thread identifier is unknown, so `source_thread` uses a descriptive label rather than an invented platform ID.

The exact clock time is unknown, so date-only values are used.

# Corrections (fix mistakes/contradictions; state what changed and why)

No factual contradictions were present in the source request.

The archive scope is limited to the user-visible active thread because that is the available evidentiary record.

# Next actions (minimal)

Review the committed files in the vault.
