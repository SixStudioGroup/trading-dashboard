---
id: "55a631f1-3126-40fa-b413-c742c80e5399"
title: "Conversation Archive Export Prompt Library"
created_at: "2026-06-07"
updated_at: "2026-06-07"
source_platform: "ChatGPT"
tags:
  - prompt-library
  - conversation-archive
  - markdown-export
  - git-patch
  - obsidian
---

## Name

Export a Conversation as a Three-File Git Patch

### When to use

Use when a conversation must be archived into an Obsidian-compatible Git repository as a canonical note, reusable prompt library, and verbatim transcript.

### Variables

- `TARGET_REPOSITORY`: Repository name or identifier.
- `BASE_PATH`: Root path for exported notes.
- `ROUTING_RULES`: Mapping from content type to destination folder.
- `LOCAL_DATE`: Current date in the required timezone.
- `SOURCE_PLATFORM`: Platform name for metadata and filenames.
- `CONVERSATION`: Complete user-visible conversation to export.

### Prompt

```text
Act as an automated conversation archivist.

Export the supplied conversation into the target Git repository by producing one valid unified diff that can be applied with git apply.

Target repository: {{TARGET_REPOSITORY}}
Base path: {{BASE_PATH}}
Local date: {{LOCAL_DATE}}
Source platform: {{SOURCE_PLATFORM}}

Use the supplied routing rules to choose exactly one destination folder. Resolve the destination, filenames, and thread slug without asking the operator.

Create exactly three new Markdown files:

1. YYYY-MM-DD--<source-platform>--<slug>--canonical.md
2. YYYY-MM-DD--<source-platform>--<slug>--prompts.md
3. YYYY-MM-DD--<source-platform>--<slug>--transcript.md

The canonical note must contain valid YAML frontmatter with id, title, created_at, updated_at, source_platform, source_thread, classification, status, domains, tags, and products.

Use these canonical headings in this exact order:

Purpose
Current state
Constraints and boundaries
Key decisions (with rationale)
Definitions and glossary
Architecture/components mentioned
Artefacts/files/repos mentioned
Operating doctrine/rules
Risks and unknowns
Corrections (fix mistakes/contradictions; state what changed and why)
Next actions (minimal)

The prompt-library file must contain valid YAML frontmatter and only reusable, deduplicated, platform-agnostic prompts. Every prompt entry must contain Name, When to use, Variables when applicable, and Prompt in a fenced code block.

The transcript file must contain valid YAML frontmatter followed by the raw user-visible transcript verbatim.

Do not invent facts. State uncertainty explicitly. Remove conversational noise from the canonical note but retain evidence in the transcript. Avoid tables unless unavoidable.

Return only one fenced code block containing the unified diff. Include diff headers, new-file mode, target paths, and valid hunk headers. Output nothing after the code block.

Routing rules:
{{ROUTING_RULES}}

Conversation:
{{CONVERSATION}}
```
