# VAF Ecosystem Domain Map

The PM Artefact Generator is one product in the broader Velocity Architecture Framework ecosystem. It must be designed and released with awareness of the surrounding domain generators and portals, because the same users may move across multiple products during the lifecycle of a transformation initiative.

## Ecosystem Products

| Product | Repository / Location | Primary Users | Domain Role | Relationship to PM Artefact Generator |
|---|---|---|---|---|
| PMI Portal | https://zencloudau.github.io/pmi-portal/ | Program managers, PMO leads, executives and portfolio stakeholders | Program, portfolio and PMO oversight | Upstream program context and governance roll-up |
| PM Artefact Generator | https://github.com/ZenCloudAU/pm-artefact-generator | Project managers, delivery leads and project coordinators | Everyday project delivery execution | Operational project artefact workspace |
| EA Artefact Generator | https://github.com/ZenCloudAU/ea-artefact-generator | Enterprise architects and architecture governance stakeholders | Enterprise architecture and VAF design-system reference | Master visual, interaction and Cloudflare deployment reference |
| BA Artefact Generator | https://github.com/ZenCloudAU/ba-artefact-generator | Business analysts and business architects | Business requirements, processes, capabilities and analysis artefacts | Downstream and upstream source for requirements, process context and business artefacts |
| SA Artefact Generator | https://github.com/ZenCloudAU/sa-artefact-generator | Solution architects and technical delivery stakeholders | Solution design, technical architecture and implementation-ready design artefacts | Source for technical scope, dependencies, solution constraints and delivery handoff artefacts |

## Operating Model

The ecosystem should operate as a connected delivery fabric rather than a set of disconnected generators. Each product has its own role focus, but the user experience, design system, terminology, artefact lifecycle, context model and export behaviour must remain coherent.

The PM Artefact Generator sits in the execution layer. It consumes program context from the PMI Portal, business context from the BA generator, solution context from the SA generator and architecture context from the EA generator. It produces project execution artefacts that can roll back into the PMI Portal for program governance and into BA, SA or EA contexts where delivery outcomes affect requirements, solution design or architecture governance.

## Cross-Domain Traceability

| Source Domain | Shared Objects | PM Generator Usage |
|---|---|---|
| Program / PMO | Program, workstream, milestone, benefit, dependency, executive risk and governance cadence | Project alignment, status reporting, steering packs and escalation narratives |
| Business Analysis / Business Architecture | Business requirements, process maps, stakeholder needs, capability impacts, acceptance criteria and business rules | Scope definition, delivery planning, requirements traceability, stakeholder communications and change control |
| Solution Architecture | Solution options, non-functional requirements, integration dependencies, implementation constraints, technology decisions and cutover approach | Delivery planning, dependency management, technical readiness, release planning and test/cutover artefacts |
| Enterprise Architecture | Capability model, target architecture, principles, standards, architecture decisions and governance constraints | Project initiation, architecture alignment, governance papers and design assurance |
| Project Delivery | Project charter, RAID, schedule, status, decision log, action log, change request, closure report and delivery evidence | Operational source of truth for project execution and upward reporting |

## UX and Cognitive Flow

A user should recognise the ecosystem immediately through consistent VAF branding, design tokens, navigation density, artefact cards, engagement/workspace management, status treatment, export patterns and governance language. The experience should change by role and task, not by visual or interaction philosophy.

The PM Artefact Generator should use project-management language and practical delivery workflows. It should not force project managers to think like program managers, enterprise architects, business analysts or solution architects. However, it must make upstream context visible where that context improves the artefact being generated.

## Data Consumption Principle

The PM Artefact Generator should not duplicate upstream context when a sibling platform owns it. It should reference, import or link that context. For MVP this can be manual JSON import, pasted context or static schema fixtures. For MLP and later releases this should mature into API-backed shared context and a canonical VAF artefact graph.

## Release Governance Principle

Every major PM Generator release must be checked against ecosystem coherence. The release should state whether it affects PMI, BA, SA or EA integration points. If it introduces terminology, object types, artefact states or export structures that conflict with sibling tools, the release should be blocked until the inconsistency is resolved.

## UAT Principle

UAT must include cross-role scenarios. A business analyst should see how a requirement becomes project scope. A solution architect should see how a design decision becomes a delivery dependency. An enterprise architect should see how a project artefact supports governance. A program manager should see how project status rolls into program reporting. A project manager should be able to use all of that context without leaving the operational flow of daily delivery.
