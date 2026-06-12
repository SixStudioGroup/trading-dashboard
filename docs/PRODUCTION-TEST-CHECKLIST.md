# SixQuant Production Readiness Checklist

## Production Test Matrix

| Area | Validation | Expected Result | Severity | Release 1 Status |
|---|---|---|---|---|
| Root route | Open live root URL | Loads SixQuant Crypto Terminal | Critical | Pass |
| Navigation | Click every top navigation link | Correct route opens without old branding | Critical | Pass |
| Branding | Review all active screens | SixQuant and StudioSix identity consistent | Critical | Pass |
| Crypto Queue | Select crypto asset | Decision cockpit updates correctly | High | Pass |
| Stocks Queue | Select stock asset | Stock plan workflow updates correctly using ASX MVP seed/fallback | High | Conditional |
| ASX Live Feed | Validate stock data source | Production-grade live/delayed ASX feed available | Critical | Release 1 Exception |
| Journal Save | Save manual journal record | Record persists locally and appears correctly | Critical | Pass |
| Alerts Feed | Review alerts screen | Alerts framed as prompts, not trades | Critical | Pass |
| Evidence Trail | Review evidence screen | Logs framed as evidence only | High | Pass |
| Review Centre | Review reports page | Behaviour and outcome framing visible | Medium | Pass |
| Guide | Review operator manual | Workflow model understandable | Medium | Pass |
| Settings | Review local/share settings | User understands privacy boundary | Medium | Pass |
| Responsive Layout | Resize desktop/tablet/mobile widths | Navigation and tables remain usable | High | Pass |
| Data State | Simulate live/fallback state | Diagnostics remain readable but secondary | Medium | Pass |
| Empty States | Open pages with minimal/no data | Empty states remain readable and calm | Low | Pass |
| Table Overflow | Test narrow widths | Tables scroll without layout collapse | Medium | Pass |
| Holdings Reset | Test destructive action | Behaviour understood and not misleading | High | Deferred Polish |
| Share Flow | Review journal share flow | Privacy boundary clear | High | Deferred Polish |

## Production Acceptance Gates

| Gate | Requirement | Release 1 Result |
|---|---|---|
| Navigation Gate | No broken active route | Pass |
| Brand Gate | No visible legacy product branding on active routes | Pass |
| Workflow Gate | User can complete Scan → Analyse → Decide → Record → Review | Pass |
| Governance Gate | No implied automated execution | Pass |
| UX Gate | No major layout collapse on desktop or tablet | Pass |
| Crypto Data Gate | Crypto feed and fallback state understandable | Pass |
| Stocks Data Gate | Production-grade ASX live/delayed feed available | Exception: deferred to Release 1.1 |
| Journal Gate | Manual recording workflow functions correctly | Pass |
| Review Gate | Behaviour review and trade review function correctly | Pass |

## Production Launch Decision Matrix

| Condition | Launch Decision |
|---|---|
| Release 1 controlled production for crypto/manual decision workflow | Approved |
| Release 1 controlled production for stock UX and planning workflow | Approved with ASX feed exception |
| Release 1 production-grade stock trading workflow | Not approved |
| Release 1.1 ASX live/delayed feed delivered | Required before stocks can be considered functionally production-grade |
| Broad public launch | Deferred until ASX live feed and fee/net calculations are complete |

## Release 1 ASX Exception Matrix

| ASX Capability | Release 1 State | Release 1.1 Required State |
|---|---|---|
| ASX universe | MVP seed/fallback universe | Provider-backed live/delayed ASX universe |
| Feed mode | Snapshot/fallback | Live or delayed with clear provider state |
| Feed freshness | Timestamped snapshot | Provider refresh timestamp and stale-state handling |
| Fee visibility | Visible planning inputs | Dynamic fee/net calculations and persistence |
| Trader suitability | UX validated; data incomplete | Functional Australian stock workflow |

## Controlled Production Position

| Product Boundary | Release 1 Position |
|---|---|
| Automated trading | Not supported |
| Broker execution | Not supported |
| Financial advice | Not provided |
| Crypto manual decision cockpit | Approved for controlled production use |
| Stocks UX and planning cockpit | Approved for controlled production use with ASX feed exception |
| Stocks production-grade market data | Deferred to Release 1.1 |
| Primary purpose | Improve decision discipline, planning quality, and review quality for manual traders |

## Release 1 Closure Decision

| Decision Area | Result |
|---|---|
| Release 1 UX | Closed |
| Release 1 route remediation | Closed |
| Release 1 brand migration | Closed |
| Release 1 crypto workflow | Closed |
| Release 1 stocks UX | Closed with ASX feed exception |
| Release 1 ASX production feed | Deferred to Release 1.1 as mandatory gate |
| Release 1 production release | Approved for controlled use, not broad public launch |