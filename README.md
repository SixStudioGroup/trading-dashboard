# SixSignal Terminal

SixSignal Terminal is a manual trading decision cockpit by StudioSix. It is designed to help a trader scan opportunities, analyse one asset at a time, make a controlled decision, execute externally, record the action, and review the result.

The product does not execute trades. It does not provide financial advice. It does not connect to CoinSpot or any exchange for order placement. Its operating model is deliberately manual: SixSignal decides, the trader executes externally, SixSignal records and reviews.

## Product intent

The terminal exists to reduce impulsive trading and improve repeatable decision quality. The core user is a manual crypto or equities trader who needs signal discipline, portfolio visibility, and a decision trail without turning the tool into a broker or automated trading system.

| Workflow Stage | Product Behaviour | Trader Outcome |
|---|---|---|
| Scan | Rank opportunities and surface focused candidates | Attention is directed without forcing execution |
| Analyse | Review a selected asset in the Decision Cockpit | The trader evaluates thesis, risk, and invalidation |
| Decide | Confirm whether the trade is valid, watch-only, or rejected | Action is deliberate rather than impulsive |
| Execute | Keep trade placement external to the terminal | SixSignal remains decision support, not a broker |
| Record | Update holdings, journal, and notes | Decisions become auditable |
| Review | Evaluate session and signal quality | Trading behaviour becomes repeatable |

## Current product status

The current release is a pre-1.0 product candidate. The live terminal has working surfaces for opportunity scanning, asset analysis, manual holdings, market context, alerts, fallback state, and review. The current design direction is to reduce interaction load, strengthen the Decision Cockpit, simplify feed-state presentation, and preserve manual execution discipline.

## Live site

https://zencloudau.github.io/trading-dashboard/

## Documentation map

| Document | Purpose |
|---|---|
| `docs/PRODUCT-MAP.md` | Defines the product areas and release direction |
| `docs/RELEASE-PLAN.md` | Defines launch path and acceptance criteria |
| `docs/UX-REVIEW.md` | Captures lead designer and trader review |
| `docs/TRADER-OPERATING-MODEL.md` | Defines the manual trading operating model |
| `docs/USER-GUIDE.md` | Explains the user workflow |
| `docs/KNOWN-LIMITATIONS.md` | Documents product constraints and boundaries |
| `docs/CHANGELOG.md` | Records release progress |
| `docs/DESIGN-SYSTEM.md` | Defines colour, brand, and workflow design rules |
| `docs/RESPONSE-MATRIX-STANDARD.md` | Defines the matrix and product table format for future product reviews |

## Release principle

The product should not add automation, broker execution, social trading, AI trade recommendations, or exchange integrations until the manual decision workflow is stable, documented, and repeatable.