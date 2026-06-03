# PM Artefact Generator Release Matrix

This repository is the everyday project delivery artefact workspace for project managers, delivery leads and project coordinators. It is distinct from the PMI Portal, which remains the program-management layer. This product focuses on practical project execution, artefact generation, governance hygiene and daily delivery support.

The EA Artefact Generator remains the master reference for visual design, Cloudflare deployment approach, engagement workspace patterns and schema-driven artefact generation.

| Release | Epic | Product Outcome | MVP Scope | MLP Scope | Kanban Status | Handoff Target |
|---|---|---|---|---|---|---|
| R0 Foundation | Product and platform baseline | Establish a deployable Cloudflare React application aligned to the EA generator design system | Seed Vite, React, Wrangler, metadata, design tokens, app shell and project documentation | Add shared workspace conventions, release discipline and reusable domain taxonomy | In Progress | Low-code here |
| R1 Workspace MVP | Project workspace and engagement model | Give project managers a daily project workspace rather than a static generator | Create project workspace, project switcher, local persistence, dashboard cards and core context capture | Add project health, favourites, recent artefacts and role-based workspace views | Ready for Build | Codex for implementation |
| R1 Artefact MVP | Core project artefact generation | Generate the essential artefacts needed to initiate and run a project | Charter, scope statement, RAID, stakeholder matrix, status report, action log, decision log and change request | Add artefact quality scoring, review modes, templates and export-ready metadata | Ready for Build | Codex or Claude |
| R2 Delivery Operations | Everyday delivery control | Help delivery leads and coordinators manage weekly project rhythm | Meeting minutes, weekly status, steering update, dependency log, communications plan and milestone tracker | Add reusable meeting packs, action follow-up prompts and delivery-health narrative generation | Planned | Claude for UX, Codex for code |
| R2 Export Layer | Practical output and handoff | Make artefacts usable outside the app | Markdown copy, CSV export for logs, JSON artefact export and printable views | DOCX, PDF, PPTX, XLSX, Jira, Confluence and DevOps publishing | Planned | Console execution |
| R3 Governance and Assurance | Project governance discipline | Create consistent governance artefacts for project control | Governance brief, stage-gate checklist, assurance review, risk escalation and exception report | Add governance maturity scoring, approval workflow and audit trail | Planned | Codex and Claude |
| R3 AI Orchestration | Model-routed generation | Route the right generation task to the right model or execution agent | Provider abstraction, prompt contracts, JSON schema outputs and deterministic fallback handling | Multi-agent routing across OpenAI, Claude, Gemini and Codex with task-specific orchestration | Planned | Console execution |
| R4 Enterprise Integration | Operational integration | Connect the project workspace into enterprise delivery systems | Export payload contracts and repository-ready artefact packages | Live integrations with Jira, Azure DevOps, Confluence, SharePoint and enterprise storage | Future | Console execution |
| R5 MLP Platform | Loved daily PM tool | Move from useful generator to preferred project delivery cockpit | Refined UX, saved project memory, templates and daily workflow surfaces | Role-personalised operating desk, smart next actions, proactive delivery prompts and enterprise-grade polish | Future | Mixed |

## MVP Definition

The MVP is a usable Cloudflare-hosted React application that lets a project manager create a project workspace, capture project context, select a core project artefact, generate structured artefact content, save it into a local project library and export simple usable outputs. It must be visually aligned with the EA Artefact Generator and clearly separate from the PMI Portal.

## MLP Definition

The MLP is a daily-use project delivery cockpit that project managers, delivery leads and coordinators would willingly return to during active delivery. It must feel practical, fast and useful during the normal project week, not just during initial document creation. It should support recurring meetings, reporting cadence, action tracking, governance preparation, artefact reuse, quality checks and executive-ready delivery narratives.

## Major Release Handoff Rule

Low-code product shaping, artefact taxonomy, documentation, prompts, schemas and simple repository updates are executed in this thread. Major implementation, production-grade fixes, complex backend work, authentication, integrations, persistence services, AI-routing infrastructure and deployment hardening are handed off to Codex, Claude, Gemini or console execution using implementation packages generated here.
