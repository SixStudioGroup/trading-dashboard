# Ecosystem Repository Governance

Version: 0.1
Status: Active governance
Owner: Founder / CTO

## Purpose

This document defines what each repository in the ZenCloudAU ecosystem owns and what it should not absorb.

The ecosystem has moved from rapid creation into control. Repositories are no longer interchangeable. Each repo has a bounded role.

## Governance principle

Every repository has a job.

If a proposed change does not match the repository's job, the agent must stop and ask for routing rather than placing the change in the wrong repo.

## Active ecosystem map

| Repository | Role | Should do | Should not do |
|---|---|---|---|
| `ZenCloudAU/ordo-animi` | Parent AI operating system and Valour product surface | Ordo Animi, Valour, Custos, agentic guide UX, pilot console, AI workflow, product doctrine, pilot evidence | Host Velocity Architecture framework content, SA artefact product code, Executive Fast Track course content |
| `ZenCloudAU/velocity-architecture` | Public architecture framework and methodology home | Velocity Architecture framework, Velocity Vibes doctrine, enterprise and solution architecture methods, public thought leadership | Contain private Ordo Animi product IP, Valour app code, pilot records, internal tool-role mappings |
| `ZenCloudAU/sa-artefact-generator` | Solution architecture artefact product | SA artefact workflows, templates, generation UI, `sa.velocityarchitecture.com.au` deployment | Become the Valour pilot console or Ordo Animi doctrine home |
| `ZenCloudAU/executive-fast-track` | Executive leadership training pathway | Leadership training content, executive modules, `exec.velocityarchitecture.com.au` deployment | Become Valour, Ordo Animi, SA Generator, or architecture framework source of truth |
| `ZenCloudAU/ea-artefact-generator` | Enterprise architecture artefact tooling | EA artefact generation and related EA tooling | Contain Valour pilot workflow or Ordo Animi operating system code |
| `ZenCloudAU/obsidian-vault` | Knowledge vault and source notes | Personal notes, strategic notes, Magister Automatorum material, knowledge exports | Be treated as product code unless explicitly prepared for publication |
| `ZenCloudAU/vallum-engine` | Boundary and governance engine candidate | Future Vallum governance logic, boundary patterns, containment experiments | Become the main Ordo Animi app or Valour console without an explicit migration decision |
| Certification and academy repos | Learning and certification pathways | Course material, study apps, certification portals | Become product-platform source of truth or absorb Valour/Ordo Animi scope |
| Creative and game repos | Creative IP and game/story projects | Fiction, game systems, creative writing, worldbuilding | Contain professional architecture platform governance unless explicitly linked |

## Public versus internal language

Use public language in customer-facing repos.

Use internal operational language only in private governance docs.

| Public language | Internal language |
|---|---|
| Velocity Vibes | VibeOps |
| Founder-led agentic delivery | Tool orchestration discipline |
| Architecture-governed AI delivery | Model role routing |
| Custos | Persistent guide implementation layer |
| Valour | Valour product implementation and pilot console |

## Naming policy

Use title case for product and system names in prose.

Preferred forms:

- Ordo Animi
- Valour
- Vita
- Vallum
- Veritas
- Via
- Custos
- Magister Automatorum
- Velocity Vibes
- Velocity Architecture

Avoid all-caps module naming except where used intentionally for logo or visual identity.

## Agent routing policy

Before making changes, an agent must identify the target repository, product layer, publication level, change type, and whether the change matches repository scope.

If there is uncertainty, the agent must stop and ask for routing.

## Deployment ownership

| Surface | Owning repo |
|---|---|
| `www.ordoanimi.com` | `ZenCloudAU/ordo-animi` |
| `sa.velocityarchitecture.com.au` | `ZenCloudAU/sa-artefact-generator` |
| `exec.velocityarchitecture.com.au` | `ZenCloudAU/executive-fast-track` |
| `ea.velocityarchitecture.com.au` | Velocity Architecture or EA-related repo as configured |

## Change control levels

Low-risk changes include documentation, release notes, governance notes, planning material, typo fixes, and naming cleanup.

Medium-risk changes include UX copy, public docs, route text, styling, limited component adjustments, roadmap changes, and repo-local guardrails.

High-risk changes include identity, persistence, payment, provider routing, deployment configuration, destructive refactors, repo moves, domain changes, and major product scope changes.

High-risk changes require explicit Founder / CTO approval and a focused implementation brief.

## Stop conditions

An agent must stop if the work belongs in another repo, private doctrine would be exposed publicly, a product starts absorbing another product's role, a deployment target is unclear, secrets might be exposed, major scope is added without release approval, or UX complexity increases without clear value.

## Current control posture

The ecosystem has entered control mode.

The next objective is not more uncontrolled product creation. The next objective is coherence, governance, clean release boundaries, and agentic UX quality.
