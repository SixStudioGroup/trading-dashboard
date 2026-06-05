# Founder Incubator Estate Architecture

Version: 0.1
Status: Active estate architecture
Owner: Founder / CTO

## Purpose

This document organises the ZenCloudAU estate as a founder incubator rather than a loose collection of repositories.

The estate has moved from ideation into consolidation. The purpose now is to categorise products, frameworks, tools, creative IP, learning assets, and future startup candidates so that new work can be routed deliberately.

## Founder incubator model

The estate is not one product.

It is a portfolio of related ventures, frameworks, tools, and intellectual property. Some assets are products now. Some are future products. Some are frameworks. Some are private knowledge systems. Some are creative IP that may later become games, books, or media properties.

The operating model is:

Founder vision -> estate architecture -> product category -> repository boundary -> release path -> validation -> spin-out decision.

## Estate categories

| Category | Description | Current examples | Future path |
|---|---|---|---|
| AI operating systems | Products that provide AI-guided cognition, orchestration, or behavioural support | Ordo Animi, Valour, Custos, Vallum Engine, Magister Automatorum | SaaS, agentic assistant, personal/professional operating system |
| Architecture frameworks | Professional architecture doctrine, methods, and thought leadership | Velocity Architecture, Velocity Vibes, EA guidance | Consulting IP, public framework, training, advisory products |
| Architecture tooling | Tools that generate or support architecture artefacts | SA Artefact Generator, EA Artefact Generator | Specialist SaaS tools, partner workflows, enterprise enablement |
| Leadership education | Structured leadership and executive learning products | Executive Fast Track, Velocity Academy | Learning products, cohort training, executive pathways |
| Certification and learning | Certification support, study products, technical learning paths | SAPEA, CISSP, Azure SA, Agentic Cert, VAF learning repos | Education products, study portals, courseware |
| Trading and decision systems | Decision-support tools with strict operating boundaries | SixSignal Terminal / trading-dashboard | Specialist decision cockpit, manual trading discipline tool |
| Creative writing and IP | Fiction, philosophy, books, worlds, stories, essays | Forsaken Saga, Wolf Meditations, writing projects | Books, games, media IP, lore systems |
| Game development | Game systems, mechanics, prototypes, interactive worlds | ScubaRogue and future game repos | Indie game products, interactive fiction, simulation systems |
| Brand and advisory | Advisory, consulting, studio, and external brand surfaces | ZenCloud Advisory, StudioSix | Commercial services, portfolio brands |
| Knowledge vault | Personal source notes and internal doctrine | Obsidian Vault | Private source material, selective publication, doctrine extraction |

## Enterprise architecture view

The estate has four architecture layers.

| Layer | Purpose |
|---|---|
| Governance layer | Magister Automatorum, repository governance, naming doctrine, release control |
| Platform layer | Ordo Animi, Valour, Custos, Vallum, agentic delivery systems |
| Professional layer | Velocity Architecture, Velocity Vibes, EA/SA tooling, Executive Fast Track |
| Creative layer | Books, games, worlds, lore, fiction, essays, creative systems |

## Solution architecture constraints

Each repository must have a clear solution boundary.

A repository should contain one primary deployable product, framework, or knowledge system. It should not absorb unrelated products simply because the idea appeared during a conversation.

If a new idea appears, route it to the correct category before implementation.

## Category boundaries

### AI operating systems

These repos may contain product code, agent workflows, AI orchestration, guide UX, and pilot state.

They should not absorb unrelated framework content, certification material, trading logic, or creative writing unless the integration is explicitly part of the product path.

### Architecture frameworks

These repos may contain public methodology, diagrams, capability models, operating models, thought leadership, and training-adjacent content.

They should not contain private Ordo Animi implementation details, API keys, pilot records, personal notes, or raw internal operating terminology.

### Architecture tooling

These repos may contain specialised artefact generation logic and UI.

They should not become general architecture frameworks or agentic operating systems.

### Leadership education

These repos may contain learning paths, modules, leadership content, and public training surfaces.

They should not become Valour, Ordo Animi, or architecture artefact generators. They can link into Valour later through guided rehearsal handoffs.

### Certification and learning

These repos should remain courseware and study-product focused.

They should not become strategic product source of truth.

### Trading and decision systems

These repos must keep strong risk boundaries. They may support manual decision quality and review, but should not execute trades or provide financial advice.

They should remain separated from Ordo Animi unless there is a deliberate future decision cockpit pattern reuse.

### Creative writing and game development

These repos are future IP assets.

They should be treated as creative incubator assets rather than mixed into professional product repos.

They may later spawn game studios, books, lore engines, narrative AI tools, or interactive systems, but each spin-out requires a product charter.

### Knowledge vault

The knowledge vault is source material, not automatically public product material.

Material from the vault must be refined, sanitised, and routed before publication or deployment.

## Repository classification

| Repo | Category | Current classification |
|---|---|---|
| `ordo-animi` | AI operating systems | Active product and parent AI system |
| `velocity-architecture` | Architecture frameworks | Public framework and methodology home |
| `sa-artefact-generator` | Architecture tooling | Active SA artefact product |
| `ea-artefact-generator` | Architecture tooling | EA artefact tooling candidate |
| `executive-fast-track` | Leadership education | Active executive learning product |
| `velocity-academy` | Leadership / learning | Academy and training surface |
| `SAPEACertification` | Certification and learning | Study/certification product |
| `CISSPCertification` | Certification and learning | Study/certification product |
| `AzureSACertification` | Certification and learning | Study/certification product |
| `agentic-cert` | Certification and learning | Agentic AI learning product |
| `trading-dashboard` | Trading and decision systems | SixSignal decision cockpit |
| `obsidian-vault` | Knowledge vault | Internal knowledge and doctrine source |
| `vallum-engine` | AI operating systems | Boundary/governance engine candidate |
| `forsaken-saga` | Creative writing and IP | Fiction/worldbuilding asset |
| `ts-wolf-meditations` | Creative writing and IP | Writing/philosophy asset |
| `scubarogue` | Game development | Game prototype / creative product candidate |
| `studiosix` | Brand and advisory | Studio/brand surface |
| `zencloud-advisory` | Brand and advisory | Advisory services surface |
| `coffee-curiosity-engine` | Creative / experimental | Product experiment requiring classification before expansion |

## Incubation stages

| Stage | Meaning | Governance requirement |
|---|---|---|
| Spark | Raw idea or conversation thread | Capture only; do not build yet |
| Concept | Named product or framework idea | Create short charter |
| Prototype | Working mock or isolated proof | Define repo boundary |
| Pilot | Usable product with live validation | Define release notes and acceptance criteria |
| Product | Stable user-facing asset | Add governance and roadmap |
| Venture | Candidate startup or commercial line | Define business model, ownership, and go-to-market |

## Spin-out rule

A repo or idea becomes a spin-out candidate only when it has:

- a distinct user,
- a distinct problem,
- a distinct value proposition,
- a distinct delivery surface,
- a distinct commercial path,
- a product charter,
- a repo boundary,
- a governance note.

Until then, it remains an incubator asset.

## Estate constraints

Do not merge products because they feel related.

Do not expose private doctrine publicly without sanitisation.

Do not build a new app before assigning it to a category.

Do not let creative IP leak into professional products unless explicitly framed.

Do not let professional architecture tooling absorb Ordo Animi.

Do not let Valour become every leadership, coaching, education, and wellbeing product at once.

Do not let any agent deploy code into a repo unless the repo owns that capability.

## Next governance actions

Create repo-local `AGENTS.md` guardrails for the active product repos after this estate architecture is accepted.

Priority repos:

- `ordo-animi`
- `velocity-architecture`
- `sa-artefact-generator`
- `executive-fast-track`
- `trading-dashboard`
- `obsidian-vault`
- `vallum-engine`

## Conclusion

The estate is now a founder incubator portfolio.

The next phase is not uncontrolled creation. The next phase is classification, governance, focused productisation, and selective spin-out.
