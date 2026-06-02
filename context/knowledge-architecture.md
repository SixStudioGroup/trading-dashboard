# Knowledge Architecture

## Decision

The Forsaken Saga will not create a separate standalone Obsidian vault inside this repository.

The existing ZenCloud Obsidian vault remains the master personal knowledge system:

https://github.com/ZenCloudAU/obsidian-vault

The Forsaken Saga repository remains the production repo for the game, devlog, public site, project records, sprint artefacts, and game-specific source files.

## Working Model

The master vault captures broad knowledge, personal notes, cross-project learning, and ecosystem-wide thinking.

The Forsaken Saga repo captures game-specific artefacts that need to live with the project:
- game design records,
- sprint plans,
- command logs,
- tool registers,
- Godot learning notes,
- devlog entries,
- public documentation,
- world bible extracts,
- and release artefacts.

## Sync Rule

The Obsidian vault is the thinking system.

The Forsaken Saga repo is the delivery system.

When a note becomes project-critical, it should be copied or summarised into the Forsaken Saga repo so future coding sessions, releases, and public devlogs remain self-contained.

## Avoided Anti-Pattern

Do not create multiple competing vaults for the same project.

Do not scatter canonical decisions between unrelated folders.

Do not make Phil hunt across five systems during a build sprint.

## Practical Local Setup

Primary local repo path:

C:\Users\phill\Documents\GitHub\forsaken-saga

Existing vault repo path:

C:\Users\phill\Documents\GitHub\obsidian-vault

The two repos should remain separate, but linked by references and mirrored summaries where needed.
