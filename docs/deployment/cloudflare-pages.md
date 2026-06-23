# SixQuant — Cloudflare Pages Deployment (private repo, free)

**Why this doc:** `trading-dashboard` is private under `SixStudioGroup` on the free
GitHub plan, which does **not** serve GitHub Pages from a private repo — the
`sixstudiogroup.github.io/trading-dashboard/` URL returns **404** for everyone.
Cloudflare Pages hosts a **private** GitHub repo for **free**. The site is plain
static HTML/CSS/JS with **no build step**, so deployment is trivial.

The repo is already prepared:
- `wrangler.toml` — Pages project (`sixquant`), output dir `.`
- `_headers` — security headers + an app-compatible CSP
- `.assetsignore` — keeps internal docs/scripts/generators out of the public deploy
- `.github/workflows/deploy-cloudflare.yml` — auto-deploys on push to `main`
  (no-ops cleanly until the two secrets below exist)

Pick **one** of the paths below. Both end at `https://sixquant.pages.dev` (rename the
project if you prefer a different subdomain).

---

## Path A — Dashboard "Connect to Git" (recommended, no secrets, ~3 min)

1. **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.**
2. **Authorize Cloudflare's GitHub app** for the `SixStudioGroup` org (private access is
   fine — that's the point), then select repo **`SixStudioGroup/trading-dashboard`**.
3. **Production branch:** `main`. **Build settings:**
   | Field | Value |
   |---|---|
   | Framework preset | **None** |
   | Build command | *(leave empty)* |
   | Build output directory | `/` |
4. **Save and Deploy.** Cloudflare publishes to `https://sixquant.pages.dev` (or the
   project name you chose). Every push to `main` redeploys automatically.

With Path A you can **delete** `.github/workflows/deploy-cloudflare.yml` (Cloudflare
builds directly; the Action is only needed for Path B).

---

## Path B — CI auto-deploy via GitHub Actions (in-repo, no dashboard Git link)

1. **Create an API token:** Cloudflare dashboard → My Profile → API Tokens → Create
   Token → use the **"Cloudflare Pages — Edit"** template (Account › Cloudflare Pages ›
   Edit). Copy the token.
2. **Find your Account ID:** Workers & Pages → right sidebar → Account ID.
3. **Add two repo secrets** (GitHub → repo → Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Re-run the **Deploy to Cloudflare Pages** workflow (Actions tab → Run workflow), or
   push any commit to `main`. The workflow creates the `sixquant` project on first run
   and publishes the site. Before the secrets exist the job runs **green and skips** the
   deploy (a notice explains why), so it never shows red.

---

## After it's live

- Confirm `https://sixquant.pages.dev/` loads and the Crypto + Stocks terminals render.
- (Optional) **Custom domain:** Pages project → Custom domains → add e.g.
  `sixquant.sixstudiogroup.com`; Cloudflare provisions SSL automatically. Then update
  `site_url` in `.github/workflows/link-integrity.yml` to that domain.
- GitHub Pages needs nothing turned off (it never served — private + free plan).

## Notes

- `_headers` ships a CSP that allows the site's inline `<script>` bootstrap, the Lucide
  CDN (unpkg), and `connect-src` to `api.github.com` (gist share) + `api.coingecko.com`.
  If you later remove the inline scripts, tighten `script-src` to drop `'unsafe-inline'`.
- `.assetsignore` requires Wrangler ≥ 3.90 (the pinned Action and local wrangler 4.x both
  satisfy it). If a future Wrangler ignores it, internal `docs/`/`scripts/` would be
  served publicly — re-check after major Wrangler bumps.
- This supersedes hosting on GitHub Pages; the `update-*-snapshot.yml` data workflows are
  unaffected (they commit `data/*.json` to `main`, which then redeploys).
