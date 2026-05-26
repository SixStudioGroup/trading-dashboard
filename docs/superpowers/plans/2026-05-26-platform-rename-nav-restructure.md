# Platform Rename & Nav Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardise the platform name to "ZenCloud Trading OS" on all pages and replace the flat 7-link nav with a context-sensitive nav that has workspace switcher buttons, a vertical divider, and a consistent set of content links including Settings.

**Architecture:** Pure HTML and CSS changes across 8 static pages. No JS changes. Three nav variants: workspace-Crypto (index.html), workspace-Stocks (stocks.html), shared (all other pages). Three CSS rules added to styles.css.

**Tech Stack:** HTML5, CSS custom properties. No JS, no build step, no dependencies.

---

## File Map

| File | What changes |
|---|---|
| `styles.css` | Add `.nav-workspace-btn`, `.nav-workspace-btn.active`, `.nav-divider` |
| `index.html` | Title, brand text, aria-label, nav → workspace-Crypto variant |
| `stocks.html` | Title, nav → workspace-Stocks variant |
| `logs.html` | Title, brand text, aria-label, nav → shared variant (Logs active) |
| `alerts.html` | Title, brand text, aria-label, nav → shared variant (Alerts active) |
| `journal.html` | Title, nav → shared variant (Journal active) — adds Logs/Alerts links |
| `reports.html` | Title, nav → shared variant (Reports active) |
| `guide.html` | Title, nav → shared variant (Guide active) |
| `settings.html` | Title, nav → shared variant (Settings active) |

---

## Task 1: CSS — Workspace Button and Divider Styles

**Files:**
- Modify: `styles.css` (append after line 1743)

- [ ] **Step 1: Verify classes don't exist yet**

  Run:
  ```bash
  grep -n "nav-workspace-btn\|nav-divider" styles.css
  ```
  Expected: no output (classes don't exist yet).

- [ ] **Step 2: Append three rules to end of styles.css**

  Add after the last closing `}` in the file (currently line 1743):

  ```css
  .nav-workspace-btn {
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 2px 10px;
      background: var(--panel);
  }
  .nav-workspace-btn.active {
      background: var(--brand-blue);
      color: #fff;
      border-color: var(--brand-blue);
  }
  .nav-divider {
      display: inline-block;
      width: 1px;
      height: 1em;
      background: var(--line);
      margin: 0 4px;
      vertical-align: middle;
  }
  ```

- [ ] **Step 3: Verify rules were added**

  Run:
  ```bash
  grep -n "nav-workspace-btn\|nav-divider" styles.css
  ```
  Expected output (line numbers may vary):
  ```
  1745:.nav-workspace-btn {
  1751:.nav-workspace-btn.active {
  1756:.nav-divider {
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add styles.css
  git commit -m "style: add nav workspace button and divider styles"
  ```

---

## Task 2: index.html — Rename + Workspace Nav (Crypto Active)

**Files:**
- Modify: `index.html`

**Context:** index.html currently has title `ZenCloud Crypto Dashboard`, brand text `ZenCloud Crypto Dashboard`, and a flat nav with `class="active"` on the Crypto Workspace link.

- [ ] **Step 1: Verify current state**

  Run:
  ```bash
  grep -n "Crypto Dashboard\|nav-workspace-btn" index.html
  ```
  Expected: lines referencing "ZenCloud Crypto Dashboard", no `nav-workspace-btn`.

- [ ] **Step 2: Update title**

  Find and replace:
  ```html
  <title>ZenCloud Crypto Dashboard</title>
  ```
  With:
  ```html
  <title>Crypto Workspace — ZenCloud Trading OS</title>
  ```

- [ ] **Step 3: Update brand text and aria-label**

  Find and replace:
  ```html
  <a class="brand" href="index.html" aria-label="ZenCloud Crypto Dashboard">
      <span class="brand-mark">Z</span>
      <span>ZenCloud Crypto Dashboard</span>
  </a>
  ```
  With:
  ```html
  <a class="brand" href="index.html" aria-label="ZenCloud Trading OS">
      <span class="brand-mark">Z</span>
      <span>ZenCloud Trading OS</span>
  </a>
  ```

- [ ] **Step 4: Replace nav with workspace-Crypto variant**

  Find and replace the entire `<nav>` block:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="active" href="index.html">Crypto Workspace</a>
      <a href="stocks.html">Stocks Workspace</a>
      <a href="logs.html">Market Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Shared Journal</a>
      <a href="reports.html">Shared Reports</a>
      <a href="guide.html">Shared User Guide</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn active" href="index.html">Crypto</a>
      <a class="nav-workspace-btn" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a href="logs.html">Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```

- [ ] **Step 5: Verify**

  Run:
  ```bash
  grep -n "nav-workspace-btn\|ZenCloud Trading OS\|Crypto Workspace" index.html
  ```
  Expected: title line with "Crypto Workspace — ZenCloud Trading OS", brand aria-label/span with "ZenCloud Trading OS", two `nav-workspace-btn` lines, no remaining "Crypto Dashboard".

- [ ] **Step 6: Commit**

  ```bash
  git add index.html
  git commit -m "feat: rename and restructure nav on Crypto workspace"
  ```

---

## Task 3: stocks.html — Workspace Nav (Stocks Active)

**Files:**
- Modify: `stocks.html`

**Context:** stocks.html already has brand text "ZenCloud Trading OS". Title is `Stocks Workspace - ZenCloud Trading OS` (dash separator — update to em-dash). Nav is flat with `class="active"` on Stocks Workspace link.

- [ ] **Step 1: Verify current state**

  Run:
  ```bash
  grep -n "nav-workspace-btn\|<title>" stocks.html
  ```
  Expected: title line with old format, no `nav-workspace-btn`.

- [ ] **Step 2: Update title**

  Find and replace:
  ```html
  <title>Stocks Workspace - ZenCloud Trading OS</title>
  ```
  With:
  ```html
  <title>Stocks Workspace — ZenCloud Trading OS</title>
  ```

- [ ] **Step 3: Replace nav with workspace-Stocks variant**

  Find and replace the entire `<nav>` block:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a href="index.html">Crypto Workspace</a>
      <a class="active" href="stocks.html">Stocks Workspace</a>
      <a href="logs.html">Market Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Shared Journal</a>
      <a href="reports.html">Shared Reports</a>
      <a href="guide.html">Shared User Guide</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn" href="index.html">Crypto</a>
      <a class="nav-workspace-btn active" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a href="logs.html">Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```

- [ ] **Step 4: Verify**

  Run:
  ```bash
  grep -n "nav-workspace-btn\|<title>" stocks.html
  ```
  Expected: title with em-dash, two `nav-workspace-btn` lines (second with `active`).

- [ ] **Step 5: Commit**

  ```bash
  git add stocks.html
  git commit -m "feat: rename and restructure nav on Stocks workspace"
  ```

---

## Task 4: logs.html + alerts.html — Rename + Shared Nav

**Files:**
- Modify: `logs.html`
- Modify: `alerts.html`

**Context:** Both pages still say "ZenCloud Crypto Dashboard" in title, brand text, and aria-label. Both need the shared nav variant.

### logs.html

- [ ] **Step 1: Update logs.html title**

  Find and replace:
  ```html
  <title>Market Logs - ZenCloud Crypto Dashboard</title>
  ```
  With:
  ```html
  <title>Market Logs — ZenCloud Trading OS</title>
  ```

- [ ] **Step 2: Update logs.html brand text and aria-label**

  Find and replace:
  ```html
  <a class="brand" href="index.html" aria-label="ZenCloud Crypto Dashboard">
      <span class="brand-mark">Z</span>
      <span>ZenCloud Crypto Dashboard</span>
  </a>
  ```
  With:
  ```html
  <a class="brand" href="index.html" aria-label="ZenCloud Trading OS">
      <span class="brand-mark">Z</span>
      <span>ZenCloud Trading OS</span>
  </a>
  ```

- [ ] **Step 3: Replace logs.html nav**

  Find and replace the entire `<nav>` block:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a href="index.html">Crypto Workspace</a>
      <a href="stocks.html">Stocks Workspace</a>
      <a class="active" href="logs.html">Market Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Shared Journal</a>
      <a href="reports.html">Shared Reports</a>
      <a href="guide.html">Shared User Guide</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn" href="index.html">Crypto</a>
      <a class="nav-workspace-btn" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a class="active" href="logs.html">Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```

### alerts.html

- [ ] **Step 4: Update alerts.html title**

  Find and replace:
  ```html
  <title>Alerts - ZenCloud Crypto Dashboard</title>
  ```
  With:
  ```html
  <title>Alerts — ZenCloud Trading OS</title>
  ```

- [ ] **Step 5: Update alerts.html brand text and aria-label**

  Find and replace:
  ```html
  <a class="brand" href="index.html" aria-label="ZenCloud Crypto Dashboard">
      <span class="brand-mark">Z</span>
      <span>ZenCloud Crypto Dashboard</span>
  </a>
  ```
  With:
  ```html
  <a class="brand" href="index.html" aria-label="ZenCloud Trading OS">
      <span class="brand-mark">Z</span>
      <span>ZenCloud Trading OS</span>
  </a>
  ```

- [ ] **Step 6: Replace alerts.html nav**

  Find and replace the entire `<nav>` block:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a href="index.html">Crypto Workspace</a>
      <a href="stocks.html">Stocks Workspace</a>
      <a href="logs.html">Market Logs</a>
      <a class="active" href="alerts.html">Alerts</a>
      <a href="journal.html">Shared Journal</a>
      <a href="reports.html">Shared Reports</a>
      <a href="guide.html">Shared User Guide</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn" href="index.html">Crypto</a>
      <a class="nav-workspace-btn" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a href="logs.html">Logs</a>
      <a class="active" href="alerts.html">Alerts</a>
      <a href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```

- [ ] **Step 7: Verify both files**

  Run:
  ```bash
  grep -n "Crypto Dashboard\|nav-workspace-btn\|<title>" logs.html alerts.html
  ```
  Expected: titles with "ZenCloud Trading OS", two `nav-workspace-btn` lines per file, zero "Crypto Dashboard" matches.

- [ ] **Step 8: Commit**

  ```bash
  git add logs.html alerts.html
  git commit -m "feat: rename and restructure nav on logs and alerts pages"
  ```

---

## Task 5: journal.html + reports.html — Shared Nav

**Files:**
- Modify: `journal.html`
- Modify: `reports.html`

**Context:** Both pages already have brand text "ZenCloud Trading OS". Titles use "Shared Journal"/"Shared Reports" — update to short form. journal.html nav is missing Logs/Alerts links; reports.html nav has old flat structure.

### journal.html

- [ ] **Step 1: Update journal.html title**

  Find and replace:
  ```html
  <title>Shared Journal - ZenCloud Trading OS</title>
  ```
  With:
  ```html
  <title>Journal — ZenCloud Trading OS</title>
  ```

- [ ] **Step 2: Replace journal.html nav**

  Find and replace:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a href="index.html">Crypto Workspace</a>
      <a href="stocks.html">Stocks Workspace</a>
      <a class="active" href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn" href="index.html">Crypto</a>
      <a class="nav-workspace-btn" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a href="logs.html">Logs</a>
      <a href="alerts.html">Alerts</a>
      <a class="active" href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```

### reports.html

- [ ] **Step 3: Update reports.html title**

  Find and replace:
  ```html
  <title>Shared Reports - ZenCloud Trading OS</title>
  ```
  With:
  ```html
  <title>Reports — ZenCloud Trading OS</title>
  ```

- [ ] **Step 4: Replace reports.html nav**

  Find and replace the entire `<nav>` block:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a href="index.html">Crypto Workspace</a>
      <a href="stocks.html">Stocks Workspace</a>
      <a href="logs.html">Market Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Shared Journal</a>
      <a class="active" href="reports.html">Shared Reports</a>
      <a href="guide.html">Shared User Guide</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn" href="index.html">Crypto</a>
      <a class="nav-workspace-btn" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a href="logs.html">Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Journal</a>
      <a class="active" href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```

- [ ] **Step 5: Verify both files**

  Run:
  ```bash
  grep -n "nav-workspace-btn\|<title>\|Shared Journal\|Shared Reports" journal.html reports.html
  ```
  Expected: short titles ("Journal —", "Reports —"), two `nav-workspace-btn` lines per file, zero "Shared Journal"/"Shared Reports" in titles.

- [ ] **Step 6: Commit**

  ```bash
  git add journal.html reports.html
  git commit -m "feat: restructure nav on journal and reports pages"
  ```

---

## Task 6: guide.html + settings.html — Shared Nav

**Files:**
- Modify: `guide.html`
- Modify: `settings.html`

**Context:** Both pages already have brand text "ZenCloud Trading OS". guide.html title is "Shared User Guide"; settings.html title is "Settings". settings.html nav is already shortened but needs workspace buttons added.

### guide.html

- [ ] **Step 1: Update guide.html title**

  Find and replace:
  ```html
  <title>Shared User Guide - ZenCloud Trading OS</title>
  ```
  With:
  ```html
  <title>Guide — ZenCloud Trading OS</title>
  ```

- [ ] **Step 2: Replace guide.html nav**

  Find and replace:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a href="index.html">Crypto Workspace</a>
      <a href="stocks.html">Stocks Workspace</a>
      <a href="logs.html">Market Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Shared Journal</a>
      <a href="reports.html">Shared Reports</a>
      <a class="active" href="guide.html">Shared User Guide</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn" href="index.html">Crypto</a>
      <a class="nav-workspace-btn" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a href="logs.html">Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a class="active" href="guide.html">Guide</a>
      <a href="settings.html">Settings</a>
  </nav>
  ```

### settings.html

- [ ] **Step 3: Update settings.html title**

  Find and replace:
  ```html
  <title>Settings - ZenCloud Trading OS</title>
  ```
  With:
  ```html
  <title>Settings — ZenCloud Trading OS</title>
  ```

- [ ] **Step 4: Replace settings.html nav**

  Find and replace:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a href="index.html">Crypto Workspace</a>
      <a href="stocks.html">Stocks Workspace</a>
      <a href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a class="active" href="settings.html">Settings</a>
  </nav>
  ```
  With:
  ```html
  <nav class="navlinks" aria-label="Main navigation">
      <a class="nav-workspace-btn" href="index.html">Crypto</a>
      <a class="nav-workspace-btn" href="stocks.html">Stocks</a>
      <span class="nav-divider" aria-hidden="true"></span>
      <a href="logs.html">Logs</a>
      <a href="alerts.html">Alerts</a>
      <a href="journal.html">Journal</a>
      <a href="reports.html">Reports</a>
      <a href="guide.html">Guide</a>
      <a class="active" href="settings.html">Settings</a>
  </nav>
  ```

- [ ] **Step 5: Verify both files**

  Run:
  ```bash
  grep -n "nav-workspace-btn\|<title>\|Shared User Guide" guide.html settings.html
  ```
  Expected: short titles ("Guide —", "Settings —"), two `nav-workspace-btn` lines per file, zero "Shared User Guide".

- [ ] **Step 6: Commit**

  ```bash
  git add guide.html settings.html
  git commit -m "feat: restructure nav on guide and settings pages"
  ```

---

## Task 7: Version Bump + Deploy

**Files:**
- Modify: all 8 HTML files (version query string only)

- [ ] **Step 1: Bump version string in all HTML files**

  Run:
  ```bash
  for f in alerts.html guide.html index.html journal.html logs.html reports.html settings.html stocks.html; do
    sed -i 's/v=share-20260526/v=nav-20260526/g' "$f"
  done
  ```

- [ ] **Step 2: Verify version bump**

  Run:
  ```bash
  grep -h "v=" alerts.html guide.html index.html journal.html logs.html reports.html settings.html stocks.html
  ```
  Expected: all lines show `v=nav-20260526`, no remaining `v=share-20260526`.

- [ ] **Step 3: Commit**

  ```bash
  git add alerts.html guide.html index.html journal.html logs.html reports.html settings.html stocks.html
  git commit -m "chore: bump cache-bust version to nav-20260526"
  ```

- [ ] **Step 4: Push to GitHub Pages**

  ```bash
  git push origin main
  ```

- [ ] **Step 5: Smoke test (manual, after Pages deploys ~1-2 min)**

  - [ ] All 8 page `<title>` tags read `{Page} — ZenCloud Trading OS`
  - [ ] Brand text reads "ZenCloud Trading OS" on all pages
  - [ ] Crypto workspace button active (blue fill) on `index.html` only
  - [ ] Stocks workspace button active (blue fill) on `stocks.html` only
  - [ ] Neither workspace button active on logs/alerts/journal/reports/guide/settings
  - [ ] Divider visible between workspace buttons and content links on shared pages
  - [ ] Correct content link active on each shared page
  - [ ] Settings link present and working on all 8 pages
  - [ ] No 404s on any nav link
