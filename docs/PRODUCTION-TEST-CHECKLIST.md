# SixSignal Production Readiness Checklist

## Production Test Matrix

| Area | Validation | Expected Result | Severity |
|---|---|---|---|
| Root route | Open live root URL | Loads SixSignal Crypto Terminal | Critical |
| Navigation | Click every top navigation link | Correct route opens without old branding | Critical |
| Branding | Review all active screens | SixSignal and StudioSix identity consistent | Critical |
| Crypto Queue | Select crypto asset | Decision cockpit updates correctly | High |
| Stocks Queue | Select stock asset | Stock plan workflow updates correctly | High |
| Journal Save | Save manual journal record | Record persists locally and appears correctly | Critical |
| Alerts Feed | Review alerts screen | Alerts framed as prompts, not trades | Critical |
| Evidence Trail | Review evidence screen | Logs framed as evidence only | High |
| Review Centre | Review reports page | Behaviour and outcome framing visible | Medium |
| Guide | Review operator manual | Workflow model understandable | Medium |
| Settings | Review local/share settings | User understands privacy boundary | Medium |
| Responsive Layout | Resize desktop/tablet/mobile widths | Navigation and tables remain usable | High |
| Data State | Simulate live/fallback state | Diagnostics remain readable but secondary | Medium |
| Empty States | Open pages with minimal/no data | Empty states remain readable and calm | Low |
| Table Overflow | Test narrow widths | Tables scroll without layout collapse | Medium |
| Holdings Reset | Test destructive action | Behaviour understood and not misleading | High |
| Share Flow | Review journal share flow | Privacy boundary clear | High |

## Production Acceptance Gates

| Gate | Requirement |
|---|---|
| Navigation Gate | No broken active route |
| Brand Gate | No visible legacy ZenCloud Trading OS branding on active routes |
| Workflow Gate | User can complete Scan → Analyse → Decide → Record → Review |
| Governance Gate | No implied automated execution |
| UX Gate | No major layout collapse on desktop or tablet |
| Data Trust Gate | Snapshot/demo/live state understandable |
| Journal Gate | Manual recording workflow functions correctly |
| Review Gate | Behaviour review and trade review function correctly |

## Production Launch Decision Matrix

| Condition | Launch Decision |
|---|---|
| All critical checks pass | Approve controlled production use |
| One critical check fails | Block release |
| High-severity UX issue exists | Delay external user testing |
| Only low-severity polish issues remain | Proceed with controlled release |

## Controlled Production Position

SixSignal Release 1.0 is intended for controlled manual use and behavioural trading review.

The platform is not:

- automated trading
- broker execution software
- financial advice
- portfolio management software
- institutional market infrastructure

The purpose of the product is to improve decision discipline, planning quality, and review quality for manual traders.