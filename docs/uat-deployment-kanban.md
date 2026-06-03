# PM Artefact Generator UAT Deployment Kanban

This Kanban matrix is the product-management control view for moving the PM Artefact Generator into a full UAT-ready deployment. The product remains the everyday project-delivery workspace for project managers, delivery leads and project coordinators within the broader VAF ecosystem.

| Kanban State | Workstream | Deployment Outcome | Product Manager Position | Execution Owner | Release Gate |
|---|---|---|---|---|---|
| Done | Ecosystem Positioning | PM Generator is formally positioned as the project execution layer, distinct from the PMI Portal program layer and aligned to BA, SA and EA sibling generators | Scope is approved and stable | Product Manager | No further positioning decision required |
| Done | Release Matrix | MVP and MLP release structure is documented with explicit major-release handoff rules | Release taxonomy is usable for planning and UAT governance | Product Manager | Release scope must remain role-focused |
| Done | Ecosystem Domain Map | Cross-domain relationships across PMI, PM, BA, SA and EA are documented | Ecosystem coherence is now a release requirement | Product Manager / UX Lead | Every release must declare cross-domain impacts |
| Done | UX and UAT Coherence | Shared cognitive-flow rules are documented for users moving between program, project, business, solution and architecture tools | UAT must validate cross-role continuity, not only screen completion | UX Lead / Product Manager | UAT scripts must include program-to-project and project-to-program flow |
| In Progress | Repository Stabilisation | Repository must be cleaned into a dedicated PM Generator app baseline and separated from any legacy or unrelated static assets | This is the current blocker to a clean UAT deployment | Lead Coder / Codex | Repository structure must build locally and deploy cleanly |
| In Progress | Cloudflare/Vite App Shell | Deployable React/Vite/Cloudflare shell must be established using the EA Generator as the design-system reference | This is the first engineering execution priority | Lead Coder / Codex | npm run build must pass and wrangler deploy path must be valid |
| Ready for Build | VAF Design Baseline | Apply VAF tokens, compact enterprise header, workspace switcher, artefact cards and slate/orange/navy visual language | Must align visually with EA Generator without becoming an EA tool | UX Lead / Codex | Visual review against EA Generator reference |
| Ready for Build | Project Workspace MVP | Create project dashboard, project switcher, project context panel and project artefact library | This turns the product from a document generator into a daily PM workspace | Codex | User can create, switch and persist a project workspace |
| Ready for Build | Artefact Generator MVP | Implement core artefact generation workflows for charter, RAID, status report, stakeholder matrix, action log, decision log and change request | This is the minimum useful PM capability set | Codex / Claude | Each artefact has inputs, generated output, save and export action |
| Ready for Build | Ecosystem Context Import | Add manual or JSON-based import for PMI, BA, SA and EA context | MVP can be manual, but schema must anticipate future API integration | Codex | Imported context must be visible and usable in artefact generation |
| Ready for UAT | UAT Scenario Pack | Define role-based scripts for project manager, delivery lead, coordinator, program manager, BA, SA and EA reviewer | UAT must prove workflow usefulness and ecosystem coherence | Product Manager / UX Lead | Scripts must be executable by non-developers |
| Planned | Export Layer | Add markdown copy, JSON export, CSV register export and printable views | Practical export beats complex integrations for MVP | Codex | UAT user can take outputs into external delivery tools |
| Planned | AI Orchestration | Add provider abstraction and structured prompt contracts | Not required for first static UAT if generation is mocked, but required for production path | Console / Codex | Model routing must produce schema-valid artefacts |
| Planned | Production Hardening | Add authentication, shared backend persistence, API integrations, audit trails and enterprise controls | Out of MVP UAT unless explicitly promoted | Console execution | Requires separate major release plan |

## Deployment Decision

The UAT deployment should proceed as a controlled release candidate, not as incremental cosmetic changes. The repository must first be stabilised into a clean PM application baseline. Once that baseline is confirmed, the app shell, workspace model, artefact taxonomy, context import and UAT scripts can move together into a coherent UAT release.

## Product Manager Release Position

The release is approved to proceed to engineering execution as UAT Release Candidate 1, with repository stabilisation as the active gate. The app must be assessed against product coherence, not merely technical build success. A technically deployed app that does not preserve the VAF ecosystem flow is not acceptable for UAT.

## UAT Release Candidate 1 Scope

UAT RC1 must demonstrate that a project manager can open the platform, create a project workspace, import or enter project and program context, generate core project artefacts, save artefacts to the workspace and export usable delivery outputs. It must also demonstrate that a program manager, business analyst, solution architect and enterprise architect can understand how their upstream context flows into project delivery artefacts.

## UAT Exit Criteria

UAT passes only when the platform is visually coherent with the EA Generator, contextually coherent with the PMI Portal, semantically coherent with BA and SA generators, and operationally useful for a real project manager during weekly delivery rhythm.
