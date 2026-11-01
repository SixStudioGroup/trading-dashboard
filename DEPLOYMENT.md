# Deployment

| Field | Value |
|---|---|
| Production URL | https://sixstudiogroup.github.io/trading-dashboard/ |
| Platform | GitHub Pages |
| Source branch | `main` |
| Site type | Static HTML, CSS and JavaScript |
| Product | SixQuant Terminal by Six Studio Group |
| Current release | SixQuant 1.0 (`docs/RELEASE-SIXQUANT-1.0.md`) |
| Primary surface | Crypto Terminal |
| Secondary surface | Stocks Terminal with delayed ASX feed |
| Data automation | GitHub Actions generating committed JSON snapshots |
| Pipeline health | Workflows write `data/heartbeat-<feed>.json`; terminals flag missed runs |

A deployment is not considered verified until the live Crypto and Stocks pages load, feed-state labels are correct, the pipeline heartbeat reports OK, no blocking browser error prevents analysis or plan entry, and the phone layout (390px) fits without horizontal page overflow.

Cache-bust discipline: bump the `?v=` query on any changed css/js link (currently `app.js`, `sq-core.js`, `sq-store.js`, `today.js` and `stocks.js` at `?v=mon-1`, `sixquant.css` at `?v=mon-2`).
