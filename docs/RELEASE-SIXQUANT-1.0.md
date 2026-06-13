# Release Pack — SixQuant 1.0

| Field | Value |
|---|---|
| Release | SixQuant 1.0 |
| Date | 2026-06-13 |
| Production URL | https://zencloudau.github.io/trading-dashboard/ |
| Deploy | GitHub Pages, `main` branch root, push-to-deploy |
| Commit range | `f189232` … `4522183` |
| Status | Live, verified, released for live testing |

## What this release is

The SixSignal trading dashboard rebadged and hardened into **SixQuant by
StudioSix** — a decision-support trading terminal with enforced risk
discipline, working data pipelines with health monitoring, and layouts that
adapt to phone, tablet, and desktop automatically.

The operating boundary is unchanged and load-bearing: SixQuant plans,
records, and reviews. It never places orders, never connects to a broker,
never holds trading-capable credentials (SECURITY.md).

## Shipped in 1.0

### Platform identity
- SixQuant rebadge across every surface, document, workflow, and data
  schema label. Dark trading-terminal theme (charcoal surfaces, blue
  accent, market green/red, mono numerics, new mark + favicon).

### Risk discipline
- **Five-Question Gate** in the Decision Cockpit: cash, concentration,
  news, 20/50-day trend, defined downside — required before a plan can be
  confirmed or saved.
- **Risk Rules** (Settings → Risk Rules; stored per browser): max position
  % of account (default 8), cash reserve % (default 20), exit-alert
  drawdown % (default 8). Position-cap breaches and missing invalidation
  **block** plans on both terminals; reserve shortfall warns.
- **Exit alerts**: Position Monitor rows flag past-threshold drawdowns;
  the unified Alerts feed carries a risk row per breach.

### Pipeline health
- All three snapshot workflows (crypto 3×/day, ASX 3×/weekday, stocks
  3×/weekday) write `data/heartbeat-<feed>.json` per run.
- Crypto terminal shows pipeline heartbeat in feed diagnostics (flags past
  12h); Stocks terminal shows a missed-run banner (76h threshold spans the
  weekend gap).

### Device modes
- Auto-detected phone / tablet / desktop layouts (`sixquant-mode.js`,
  lockable in Settings → Display Mode).
- Phone = Check mode: glance strip (portfolio, open positions + worst
  drawdown, exit-alert count, regime) and priority-column tables that fit
  the screen — no invisible side-scroll (iOS hides scrollbars).

### Defects fixed in this release
1. `formatTimestamp` missing from stocks.js scope — populated ASX feed
   crashed all stocks rendering (the original broken-console report).
2. Stocks journal MutationObserver observed its own innerHTML writes —
   infinite microtask loop froze the page once defect 1 was fixed.
3. Branded panels clipped wide tables above 760px — stocks queue Analyse
   and journal Delete columns unreachable on desktop.
4. Topbar overlap between 761–1180px (iPad portrait).
5. Crypto queue header one column short — 24hr label sat over 1hr data.
6. iOS: focus-zoom on small inputs, missing backdrop-filter prefix,
   safe-area padding, text-size-adjust.

## Verification evidence (live site, headless-Chrome CDP)

- Risk gate: save without gate answers → blocked with message; $99,999
  plan vs $1,000 account → "exceeds the 8% cap ($80.00 of account value)".
- Stocks plan without invalidation → blocked with risk-rule message.
- Phone 390px: `scrollWidth = 390` (no page overflow), crypto queue 391px
  with Analyse visible, stocks queue 375px with Analyse visible, Check
  strip populated from live data, 15px base type.
- Desktop 1440px: zero clipped controls (audit previously found 6), full
  column set, Check strip hidden.
- ASX delayed feed rendering 40 rows with source badge, timestamps, and
  region filters; pipeline heartbeat reporting OK.
- Console: no errors on any of the 8 pages.

## Configuration shipped

| Key | Where | Purpose |
|---|---|---|
| `sixquant.riskRules.v1` | localStorage | Risk thresholds (Settings) |
| `sixquant.deviceMode.v1` | localStorage | Layout lock (default auto) |
| `sixquant.stocks.auBrokerDefaults.v2` | localStorage | Fee defaults (auto-migrated from `sixsignal.*`) |
| `data/heartbeat-*.json` | repo, workflow-written | Pipeline health |
| `COINGECKO_API_KEY` | GitHub Secrets | Crypto snapshot generation |

## Known limitations / next phase

- **Ultrawide tier not built**: layout caps at 1380px and density is
  relaxed. The full-day-trading setup (57" screen, terminal in a ~2560px
  half-window) needs the planned density toggle, persistent status strip,
  and third column. Parked until day-trading phase begins.
- Theme presets picker (Charcoal / classic amber / light) not yet built.
- Cash-reserve check activates only when Account value (holdings + cash)
  is entered in Risk Per Trade — holdings-only data cannot infer cash.
- Stocks snapshot (Stooq) feed remains review-only demo depth; ASX delayed
  feed is the primary stocks source.
- Next roadmap tier: X1 research-brief Action (server-side 20/50-day
  moving averages feeding gate question four) — see
  `docs/IMPROVEMENT-ROADMAP.md`.

---
© 2026 Zencloud Advisory. All rights reserved. Proprietary and confidential.
