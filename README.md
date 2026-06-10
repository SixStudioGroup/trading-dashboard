# SixSignal Terminal

SixSignal Terminal is the StudioSix trading decision platform contained in this repository.

Production site: https://zencloudau.github.io/trading-dashboard/

## Product surfaces

| Surface | Purpose |
|---|---|
| Crypto Terminal | Scan, analyse, decide, record and review crypto market opportunities. |
| Stocks Terminal | Review Australian equities using delayed ASX data and fee-aware planning. |
| Journal and Review | Record plans and outcomes locally in the browser. |

## Operating boundary

SixSignal provides decision support only. It does not place orders, store broker credentials or connect to trading accounts. Prices and order details must be confirmed externally before execution.

## Data architecture

Market snapshots are generated through GitHub Actions and committed as static JSON. The interface identifies feed source, freshness and degraded states.

Key paths:

- `index.html`, `app.js`, `data/crypto-snapshot.json` — Crypto Terminal.
- `stocks.html`, `stocks.js`, `stock-release2.js`, `data/asx-feed.json` — Stocks Terminal.
- `.github/workflows/` and `tools/` — scheduled market-data generation.
- `docs/` — SixSignal product, release and UAT documentation only.

## Repository boundary

This repository contains only SixSignal trading-platform material. Do not add archive doctrine, vault exports, unrelated product concepts, games, learning journals, publishing sites or files belonging to another repository.

## Current release

Release 2 adds the ASX delayed-feed path and dynamic brokerage, spread, gross-return, net-return and breakeven calculations. Crypto remains the primary operational surface.

---
© 2026 ZenCloud Global Consultants. All rights reserved. Proprietary and confidential.
