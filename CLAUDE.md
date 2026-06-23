# SixQuant — agent context

SixQuant (formerly SixSignal) by Six Studio Group. Static decision-support trading terminal
on **Cloudflare Pages** (`main` branch, root; the private repo 404s on GitHub Pages — see
docs/deployment/cloudflare-pages.md). **Decision support only**: it plans, records,
and reviews. It never places orders, never connects to a broker, never holds
trading-capable credentials. See SECURITY.md and docs/IMPROVEMENT-ROADMAP.md.

## Surfaces

- `index.html` + `app.js` — Crypto Decision Terminal (primary)
- `stocks.html` + `stocks.js` + `stock-release2.js` — ASX Stocks Terminal (demo feed)
- `journal.html`, `alerts.html`, `logs.html`, `reports.html`, `guide.html`, `settings.html`

## Styling

- `styles.css` — base design system, token-driven (`:root` CSS variables, 277 var() uses)
- `sixquant.css` — SixQuant brand layer, loads second, overrides tokens with the dark
  trading-terminal theme. Change brand/theme here, not in styles.css.
- Fonts: Inter (UI) + IBM Plex Mono (numerics) via Google Fonts.
- Accent `#2F81F7`, up `#16C784`, down `#EA3943`, warn `#F0B90B`, page `#0A0F1C`.
- Cache-bust query params on css/js links must be bumped when those files change.

## Data pipeline

GitHub Actions generate and commit JSON snapshots (no client-side API keys):

- `update-crypto-snapshot.yml` → `tools/generate-crypto-snapshot.mjs` →
  `data/crypto-snapshot.json` (schema `sixquant.crypto.snapshot.v1`), 3×/day,
  CoinGecko key in GitHub Secrets.
- `asx-feed.yml` → `tools/generate-asx-feed.mjs` → `data/asx-feed.json`
  (schema `sixquant.asx.feed.v2`), delayed ASX data.
- Schema strings are labels, not validated; if renamed, update generators, the
  offline fallback in stock-release2.js, and committed data files together.

## localStorage namespace

User records live in the browser only. Keys: `sixquant.*` (portfolio, journals,
watchlist, settings, Gist PAT) and `sixquant.stocks.auBrokerDefaults.v2` (fee
defaults; legacy `sixsignal.*` key is migrated on load). Never rename keys without
a migration shim — it silently wipes the operator's records.

## Rules for changes

- British spelling in UI copy ("Analyse", "Artefacts" convention across SixQuant).
- No broker/exchange credentials, no execution features, no client-side secrets.
- Feed source, mode, timestamp, and degraded state must stay visible (SECURITY.md).
- Workflows: least-privilege permissions, secrets via `${{ secrets.* }}` only,
  automated commits limited to `data/` files.
- Deployment is a push to `main` — verify locally before pushing.
