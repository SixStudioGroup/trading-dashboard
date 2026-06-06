---
id: 20260607-chatgpt-coffee-curiosity-writing-engine-canonical
title: Coffee & Curiosity Writing Engine — Product Architecture and Release Control
created_at: 2026-06-07T00:00:00+10:00
updated_at: 2026-06-07T00:00:00+10:00
source_platform: ChatGPT
source_thread: Coffee & Curiosity Writing Engine build and release governance
classification: Internal
status: Draft
domains:
  - VALOR
  - Astra
  - Nexus
tags:
  - coffee-curiosity
  - writing-engine
  - product-architecture
products:
  - Ordo Animi
  - Magister Automatorum
---

## Purpose

Capture the creation, deployment, stabilisation, and governance of the Coffee & Curiosity Writing Engine.

## Current state

The writing engine exists as a deployed Cloudflare Pages application backed by the repository `ZenCloudAU/coffee-curiosity-engine`.

The product evolved from a minimal editorial cockpit into a usable daily writing environment with article navigation, local persistence, writing modes, editorial review, markdown export, copy-to-clipboard, autosave, and search.

## Constraints and boundaries

No backend, auth, sync, database, or AI generation during stabilisation.

This chat owns product governance.

Claude/Codex only execute bounded implementation tickets.

GitHub is source of truth.

Cloudflare Pages is deployment target.

## Key decisions (with rationale)

The product should not clone ProseEngine. It should become a persistent cognition and publication environment.

AI generation was deferred until the review engine understands writing modes and editorial context.

The design language was aligned with the existing Velocity Architecture visual system.

## Definitions and glossary

Thinking Codex: persistent voice, banned phrase, and editorial rule system.

Writing Mode: Essay, Fiction, Technical, Journal, Email, LinkedIn, Medium, Substack, or GitHub Docs.

Editorial Intelligence: local review logic without live AI generation.

## Architecture/components mentioned

Three-column layout:

- article navigator
- writing editor
- codex/review panel

Runtime stabilised on:

- src/main.jsx
- src/App.jsx
- src/index.css
- vite build

## Artefacts/files/repos mentioned

Repository: `ZenCloudAU/coffee-curiosity-engine`

Deployment: `https://coffee-curiosity-engine.pages.dev/`

Reference design system: `https://sa-artefact-generator.pages.dev/`

## Operating doctrine/rules

Keep releases small.

Do not add AI generation before editorial maturity.

Use real writing sessions to validate UX before adding capabilities.

## Risks and unknowns

Runtime drift between TS/JS/JSX paths caused deployment instability.

Cloudflare occasionally deployed stale commits.

## Corrections (fix mistakes/contradictions; state what changed and why)

The deployed app appeared locked because an emergency static shell replaced the functional editor.

Runtime was corrected by standardising on Vite React JSX entrypoints.

## Next actions (minimal)

Pause development.

Use the application in real writing sessions.

Resume later with Release 0.3 — Focus & Flow.
