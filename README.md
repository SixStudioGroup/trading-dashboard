# ZenCloud Trading Dashboard

ZenCloud Trading Dashboard is a manual crypto trading decision terminal. It is designed to help a trader scan opportunities, analyse one asset at a time, make a controlled decision, execute externally, record the action, and review the result.

The product does not execute trades. It does not provide financial advice. It does not connect to CoinSpot or any exchange for order placement. Its operating model is deliberately manual: ZenCloud decides, CoinSpot executes, ZenCloud records and reviews.

## Product intent

The dashboard exists to reduce impulsive trading and improve repeatable decision quality. The core user is a manual crypto trader who needs signal discipline, portfolio visibility, and a decision trail without turning the tool into a broker or automated trading system.

The product should remain focused on the decision loop:

Scan opportunities.
Analyse a selected asset.
Confirm the trade thesis.
Check risk and invalidation.
Execute externally if the decision is valid.
Record the trade or decision.
Review the session later.

## Current product status

The current release is a pre-1.0 product candidate. The live dashboard has working surfaces for opportunity scanning, asset analysis, manual holdings, market context, alerts, fallback state, and review. The next release should focus on reducing interaction noise, tightening execution gating, and formalising the trader operating model before additional features are added.

## Live site

https://zencloudau.github.io/trading-dashboard/

## Documentation map

Product direction is maintained in the `docs` folder:

- `docs/PRODUCT-MAP.md` defines the product areas and release direction.
- `docs/RELEASE-PLAN.md` defines the launch path and acceptance criteria.
- `docs/UX-REVIEW.md` captures the lead designer and trader review.
- `docs/TRADER-OPERATING-MODEL.md` defines how the dashboard should be used.
- `docs/USER-GUIDE.md` explains the user workflow.
- `docs/KNOWN-LIMITATIONS.md` documents current constraints and boundaries.
- `docs/CHANGELOG.md` records release progress.

## Release principle

The product should not add automation, broker execution, social trading, AI trade recommendations, or exchange integrations until the manual decision workflow is stable, documented, and repeatable.