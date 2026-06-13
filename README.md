# SixQuant Terminal

SixQuant Terminal is the StudioSix trading decision platform contained in this repository.

Production site: https://zencloudau.github.io/trading-dashboard/

## Product surfaces

| Surface | Purpose |
|---|---|
| Crypto Terminal | Scan, analyse, decide, record and review crypto market opportunities. |
| Stocks Terminal | Review Australian equities using delayed ASX data and fee-aware planning. |
| Journal and Review | Record plans and outcomes locally in the browser. |

## Operating boundary

SixQuant provides decision support only. It does not place orders, store broker credentials or connect to trading accounts. Prices and order details must be confirmed externally before execution.

## Data architecture

Market snapshots are generated through GitHub Actions and committed as static JSON. The interface identifies feed source, freshness and degraded states.

Key paths:

- `index.html`, `app.js`, `data/crypto-snapshot.json` — Crypto Terminal.
- `stocks.html`, `stocks.js`, `stock-release2.js`, `data/asx-feed.json` — Stocks Terminal.
- `.github/workflows/` and `tools/` — scheduled market-data generation.
- `docs/` — SixQuant product, release and UAT documentation only.

## Repository boundary

This repository contains only SixQuant trading-platform material. Do not add archive doctrine, vault exports, unrelated product concepts, games, learning journals, publishing sites or files belonging to another repository.

## Risk discipline

Plans pass through a Five-Question Gate (cash, concentration, news, trend,
defined downside) and configurable Risk Rules (position cap, cash reserve,
exit-alert drawdown — Settings → Risk Rules). Breaches block the plan; held
assets past the drawdown threshold raise exit alerts. Snapshot workflows
write heartbeat files so a missed pipeline run is flagged before data goes
stale.

## Device modes

Layout auto-detects phone, tablet, and desktop. Phones get Check mode — a
glance strip (portfolio, positions, exit alerts, regime) and
priority-column tables sized to the screen. Settings → Display Mode can
lock a layout if a device misdetects.

## Current release

**SixQuant 1.0** (2026-06-13) — platform rebadge, dark trading-terminal
theme, risk controls, pipeline heartbeat, device modes, and a defect sweep
across desktop/tablet/iOS. Pack: `docs/RELEASE-SIXQUANT-1.0.md`. Changelog:
`docs/CHANGELOG.md`. Crypto remains the primary operational surface;
Stocks runs on the delayed ASX feed for review-only planning.

---
© 2026 Zencloud Advisory. All rights reserved. Proprietary and confidential.
