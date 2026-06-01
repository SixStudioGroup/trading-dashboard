# SixSignal Release Cycles

## Release Cycle Matrix

| Release | Theme | Scope | Exit Criteria | Status |
|---|---|---|---|---|
| Release 0.1 | Prototype trading dashboard | Crypto watchlist, market data, manual holdings, basic review surfaces | User can scan crypto and maintain manual holdings | Complete |
| Release 0.2 | Decision terminal direction | Opportunity queue, analysis panel, execution boundary, fallback state | User can analyse before external execution | Complete |
| Release 0.3 | SixSignal rebrand | Product renamed, StudioSix parent identity, visual theme, favicon, route identity | User-facing product reads as SixSignal | Complete |
| Release 0.4 | Multi-asset workflow | Stocks workspace, shared journal, review, alerts, evidence trail | Crypto and stocks share one operating model | Complete |
| Release 0.5 | UX remediation | Navigation repair, route consistency, brand cleanup, screen alignment | Active routes are coherent and linked | Complete |
| Release 1.0 RC | UAT candidate | Operator manual, UAT plan, release readiness matrix, responsive polish | Controlled UAT can start | Complete |
| Release 1.0 Production | Production-ready controlled use | Production test plan, launch checklist, acceptance gates | All critical UAT checks pass | Ready for Test |
| Release 1.1 | Australian stocks realism | ASX coverage, fees, spread, net outcome, fee-aware sizing | Australian stock planning is realistic | Planned |
| Release 1.2 | Journal and behaviour refinement | Staged journal, mistake taxonomy, stronger review analytics | Trader review compliance improves | Planned |
| Release 2.0 | Integration readiness | Optional imports, export packs, stronger data governance | Integrations remain broker-neutral and controlled | Future |

## Product Release Principle

SixSignal must remain a manual decision cockpit. Release cycles should improve decision discipline, data trust, review quality, or trader realism. Features that increase noise without improving trading behaviour should be deferred.

## Release 1.0 Production Scope

| Capability | Required State |
|---|---|
| Navigation | All active routes resolve and use SixSignal language |
| Crypto | User can scan, analyse, decide, record, and review without old branding |
| Stocks | User can scan stocks, create a plan, and understand external broker boundary |
| Journal | User can record manual trades and distinguish SixSignal-origin ideas |
| Alerts | User understands alerts as prompts, not trade instructions |
| Evidence | User understands logs as audit evidence, not execution signals |
| Review | User can inspect behaviour and outcomes |
| Guide | User can reference operating rules quickly |
| Settings | User understands privacy, local storage, and sharing boundaries |

## Release 1.0 Non-Goals

| Non-Goal | Reason |
|---|---|
| Broker execution | Outside current product boundary |
| Automated trading | Conflicts with manual decision discipline |
| Financial advice | Product is decision support only |
| Full ASX production-grade universe | Release 1.1 scope |
| Advanced analytics | Release 1.2 scope |
| Cloud sync | Future release only |

## Release 1.1 Planned Scope

| Feature | Rationale |
|---|---|
| Fee-aware stock planning | Australian traders need realistic net outcome |
| Brokerage assumptions | Planning needs real execution cost context |
| Expanded ASX coverage | Current stock universe is too limited |
| Stock freshness badges | Snapshot/demo state must be obvious |
| Gross vs net result | Review must reflect realistic trade performance |

## Release 1.2 Planned Scope

| Feature | Rationale |
|---|---|
| Staged journal capture | Reduce form fatigue and improve compliance |
| Behaviour review improvements | Strengthen learning loop |
| Mistake classification | Improve trader self-correction |
| Evidence summaries | Make audit trail less technical |
| Signal naming refinement | Consider Alerts → Signals migration |