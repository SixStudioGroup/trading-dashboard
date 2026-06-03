# Ecosystem UX, UAT and Lead-Coder Handoff

The PM Artefact Generator is part of the wider VAF delivery ecosystem. It must not feel like an isolated tool. It must share cognitive flow with the PMI Portal and the EA Artefact Generator while remaining role-specific for project managers, delivery leads and project coordinators.

The PMI Portal remains the program and PMO oversight workspace. The PM Artefact Generator is the operational project-delivery workspace used by project teams executing the work. The EA Artefact Generator remains the architecture artefact reference implementation and master design-system reference.

## Product Relationship

| Platform | Primary Role | Product Function | UX Responsibility |
|---|---|---|---|
| PMI Portal | Program managers, PMO leads, portfolio stakeholders | Program oversight, governance, benefits, portfolio reporting and cross-project visibility | Provide strategic and program-level orientation |
| PM Artefact Generator | Project managers, delivery leads, project coordinators | Everyday project delivery artefact generation, project rhythm, controls and reporting | Provide fast operational execution support |
| EA Artefact Generator | Enterprise architects, solution architects, architecture governance | Architecture artefacts, ADM alignment, repository exports and architecture governance | Provide the reference visual design and artefact-generation interaction model |

## Cognitive Flow Principle

A user moving from the PMI Portal into the PM Artefact Generator should never feel they have entered a different ecosystem. The visual system, terminology, navigation tone, artefact handling, export patterns and engagement model must be coherent. The difference should be role focus, not product disconnection.

The PMI Portal answers program-level questions: what is the program, what outcomes are being governed, what projects exist, what risks matter across the portfolio, what decisions are required, what benefits are being tracked and what executives need to know.

The PM Artefact Generator answers project-level questions: what is my project, what artefact do I need today, what context has already been captured, what risks and actions need follow-up, what status report needs to go out, what governance pack must be prepared and what delivery narrative is required this week.

## Shared Data Expectations

The PM Artefact Generator should be able to reference PMI Portal data where available. It should not duplicate program information unnecessarily. Program name, project list, workstream structure, sponsors, governance cadence, strategic outcomes, key milestones, benefits, dependencies, risks and status context should be reusable across both platforms.

For the MVP, data sharing may be represented through import/export payloads, shared JSON contracts and manual context ingestion. For the MLP, this should mature into a shared VAF data layer, API contracts and persistent project/program linkage.

## Minimum Shared Data Contract

| Object | Source of Truth | Used By PM Generator For |
|---|---|---|
| Program | PMI Portal | Project alignment, governance context and executive reporting |
| Project | PM Artefact Generator, linked to PMI Portal | Project workspace, artefacts, RAID, status and delivery rhythm |
| Stakeholder | Shared | Stakeholder matrix, comms plan, governance packs and escalation narratives |
| Risk | Shared, with different aggregation levels | Project RAID and program risk reporting |
| Dependency | Shared | Project delivery planning and program-level dependency visibility |
| Milestone | Shared | Project schedule, status report and program roadmap roll-up |
| Decision | Shared | Decision log, architecture alignment and governance board packs |
| Benefit | PMI Portal | Project business case, status narrative and closure report |
| Artefact | Domain-specific but traceable | Project records, governance evidence and export packages |

## UX Rules

| UX Area | Required Behaviour |
|---|---|
| Navigation | Use consistent VAF header, workspace switcher, compact controls and dashboard-first orientation |
| Language | Use program language in PMI Portal and project execution language in PM Artefact Generator |
| Visual Design | Reuse EA generator tokens, orange accent, navy gradient, slate surfaces, compact cards and enterprise UI density |
| Artefact Lifecycle | Maintain consistent create, review, save, export and library patterns across generators |
| Context | Make program context visible but not dominant inside project workflows |
| Role Fit | Optimise PM Generator screens for speed, clarity and daily use by delivery teams |
| Handoff | Every major feature must include UX intent, data assumptions, UAT criteria and coder instructions |

## UAT Acceptance Standard

A program manager should be able to recognise how a project artefact supports program governance. A project manager should be able to generate and maintain the artefacts they need without thinking in program-management terms. A delivery lead should be able to turn project context into execution artefacts quickly. A project coordinator should be able to produce meeting outputs, action logs, status updates and registers without having to understand the full architecture model.

A successful UAT session proves that a user can move from PMI Portal context to PM Artefact Generator execution without re-entering the same information, without visual disorientation and without confusion about which platform owns which level of work.

## Lead Coder Implementation Rules

| Area | Rule |
|---|---|
| Design System | Import or replicate the EA generator VAF token structure before creating new visual patterns |
| Data Model | Do not hard-code program context into project artefacts; use explicit linked objects and source metadata |
| Integration | Treat PMI Portal data as upstream program context and PM Generator data as project execution context |
| Storage | MVP can use local persistence, but schemas must anticipate shared backend storage |
| Routing | Keep the PM Generator independently deployable while preserving future ecosystem routing |
| AI Generation | Generation prompts must declare whether they are using program context, project context or both |
| Testing | Every release must include UAT scenarios for program-to-project and project-to-program continuity |

## Major Release Handoff Package Required Contents

Each major release handed off to Codex, Claude, Gemini or console execution must include a release objective, target users, user stories, UX acceptance criteria, data contract assumptions, affected files, technical implementation notes, test cases and known exclusions. No major build should start from a vague feature request.

## Current Execution Position

This repository now uses the EA Artefact Generator as the visual and interaction reference, the PMI Portal as the upstream program-management sibling and the PM Artefact Generator as the daily project-delivery workspace. The next major build should create the MVP shell with explicit program-context import capability, even if the first release uses pasted JSON or manual context capture rather than live API integration.
