# SixQuant: Schema Fix, Journal Filter & Gist Share — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix asset-class data overlap, add journal filter bar, and add GitHub Gist-based read-only share panel.

**Architecture:** Pure JS/HTML/CSS, static GitHub Pages. All state in localStorage/sessionStorage. Share posts to `api.github.com/gists` using a user-supplied PAT stored in localStorage (private mode only).

**Tech Stack:** Vanilla JS ES6, HTML5, CSS custom properties. No new dependencies.

---

## File Map

| File | What changes |
|---|---|
| `styles.css` | Add `.asset-class-badge.unknown`, `.journal-filter-bar`, `.share-modal`, `.share-toolbar` |
| `app.js` | Add `UNKNOWN_ASSET_CLASS`, `GITHUB_PAT_STORAGE_KEY`, `KNOWN_CRYPTO_SYMBOLS`, `migrateAssetClassTags()`, update `normalizeTrade()`, update `filterTradesByAssetClass()`, add `currentJournalFilter()`, `initJournalFilterBar()`, update `renderJournal()`, add PAT functions, add share panel functions |
| `journal.html` | Add filter bar section, share toolbar, share modal, checkbox column |
| `settings.html` | Add Share Settings section with PAT input |

---

## Task 1: CSS — Unknown Badge, Journal Filter Bar, Share Modal

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add unknown badge style**

  Find the `.asset-class-badge.stock` block (ends around line 420). Add after it:

  ```css
  .asset-class-badge.unknown {
      background: rgba(217, 119, 6, 0.10);
      color: #B45309;
      border-color: rgba(217, 119, 6, 0.22);
  }
  ```

- [ ] **Step 2: Add journal filter bar styles**

  Add at end of file:

  ```css
  .journal-filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 0 10px 0;
  }

  .filter-btn {
      appearance: none;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--muted);
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
  }

  .filter-btn:hover {
      background: var(--panel-raised);
      color: var(--text);
  }

  .filter-btn.active {
      background: var(--brand-blue);
      color: #fff;
      border-color: var(--brand-blue);
  }
  ```

- [ ] **Step 3: Add share toolbar and modal styles**

  Add at end of file:

  ```css
  .share-toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
      margin-bottom: 8px;
  }

  .share-modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      z-index: 100;
      align-items: center;
      justify-content: center;
  }

  .share-modal-overlay.open {
      display: flex;
  }

  .share-modal {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 24px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.18);
  }

  .share-modal h3 {
      margin: 0 0 16px;
      font-size: 15px;
  }

  .share-fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
  }

  .share-field-check {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
  }

  .share-warning {
      background: var(--amber-bg);
      border: 1px solid rgba(217, 119, 6, 0.3);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 12px;
      color: #B45309;
      margin-bottom: 16px;
  }

  .share-result {
      background: var(--green-bg);
      border: 1px solid rgba(22, 163, 74, 0.3);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 12px;
      color: #15803D;
      margin-bottom: 12px;
      word-break: break-all;
  }

  .share-error {
      background: var(--red-bg);
      border: 1px solid rgba(220, 38, 38, 0.3);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 12px;
      color: #B91C1C;
      margin-bottom: 12px;
  }

  .share-modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
  }

  .share-checkbox-col {
      width: 28px;
  }
  ```

- [ ] **Step 4: Manual verify**

  Open any page in browser. Open DevTools → Elements. Confirm no CSS parse errors. Check `.filter-btn.active` renders blue when you add class in DevTools.

- [ ] **Step 5: Commit**

  ```bash
  git add styles.css
  git commit -m "style: add unknown badge, journal filter bar, share modal"
  ```

---

## Task 2: Schema Constants + normalizeTrade() + filterTradesByAssetClass()

**Files:**
- Modify: `app.js`

**Context:** `CRYPTO_ASSET_CLASS = "crypto"` at line 147, `STOCK_ASSET_CLASS = "stock"` at line 148. `normalizeTrade()` at line 606. `filterTradesByAssetClass()` at line 707.

- [ ] **Step 1: Add UNKNOWN_ASSET_CLASS and KNOWN_CRYPTO_SYMBOLS constants**

  After `const STOCK_ASSET_CLASS = "stock";` (line 148), add:

  ```js
  const UNKNOWN_ASSET_CLASS = "unknown";
  const GITHUB_PAT_STORAGE_KEY = "sixquant.githubPat.v1";
  const JOURNAL_FILTER_KEY = "sixquant.journalFilter.v1";
  const KNOWN_CRYPTO_SYMBOLS = new Set([
      "BTC","ETH","BNB","ADA","DOT","LTC","XLM","DOGE","THETA","FET",
      "NEAR","ETC","TRB","XRP","SOL","AVAX","MATIC","LINK","UNI","AAVE",
      "ADA","ATOM","ALGO","FTT","MANA","SAND","CRV","SUSHI","YFI","SNX"
  ]);
  ```

- [ ] **Step 2: Update normalizeTrade() to preserve "unknown"**

  Find line 615 in `normalizeTrade()`:
  ```js
  const assetClass = trade.assetClass === STOCK_ASSET_CLASS ? STOCK_ASSET_CLASS : CRYPTO_ASSET_CLASS;
  ```
  Replace with:
  ```js
  const assetClass = [CRYPTO_ASSET_CLASS, STOCK_ASSET_CLASS, UNKNOWN_ASSET_CLASS].includes(trade.assetClass)
      ? trade.assetClass
      : CRYPTO_ASSET_CLASS;
  ```

- [ ] **Step 3: Update filterTradesByAssetClass() to always pass through "unknown"**

  Find the function (line 707):
  ```js
  function filterTradesByAssetClass(trades, filter = "all") {
      if (filter === CRYPTO_ASSET_CLASS || filter === STOCK_ASSET_CLASS) {
          return trades.filter(trade => trade.assetClass === filter);
      }
      return trades;
  }
  ```
  Replace with:
  ```js
  function filterTradesByAssetClass(trades, filter = "all") {
      if (filter === CRYPTO_ASSET_CLASS || filter === STOCK_ASSET_CLASS) {
          return trades.filter(trade => trade.assetClass === filter || trade.assetClass === UNKNOWN_ASSET_CLASS);
      }
      return trades;
  }
  ```

- [ ] **Step 4: Update assetClassBadge() to handle "unknown"**

  Find `assetClassBadge()` (line 722). The function currently only handles `stock` vs anything-else. Replace:
  ```js
  function assetClassBadge(assetClass) {
      const label = assetClass === STOCK_ASSET_CLASS ? "Stock" : assetClass === UNKNOWN_ASSET_CLASS ? "?" : "Crypto";
      const klass = assetClass === STOCK_ASSET_CLASS ? "stock" : assetClass === UNKNOWN_ASSET_CLASS ? "unknown" : "crypto";
      return `<span class="asset-class-badge ${klass}">${label}</span>`;
  }
  ```

- [ ] **Step 5: Browser console verify**

  Open journal.html in browser. In DevTools console:
  ```js
  normalizeTrade({ assetClass: "unknown", symbol: "XYZ", entryPrice: 10, positionSize: 100, reasonEntry: "test", plannedInvalidation: "test" }).assetClass
  // Expected: "unknown"
  normalizeTrade({ symbol: "BTC", entryPrice: 50000, positionSize: 1000, reasonEntry: "test", plannedInvalidation: "test" }).assetClass
  // Expected: "crypto"
  filterTradesByAssetClass([{assetClass:"unknown"},{assetClass:"crypto"},{assetClass:"stock"}], "crypto")
  // Expected: [{assetClass:"unknown"},{assetClass:"crypto"}]
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add app.js
  git commit -m "feat: add unknown asset class, preserve in normalizeTrade and filter"
  ```

---

## Task 3: Migration Function

**Files:**
- Modify: `app.js`

**Context:** `boot()` at line 2841. `initJournalControls()` at line 2795.

- [ ] **Step 1: Add migrateAssetClassTags() function**

  Add before `boot()`:

  ```js
  function migrateAssetClassTags() {
      if (isPublicDemoMode()) return;
      if (!storageAvailable()) return;
      const stored = window.localStorage.getItem(TRADE_JOURNAL_STORAGE_KEY);
      if (!stored) return;
      let records;
      try { records = JSON.parse(stored); } catch { return; }
      if (!Array.isArray(records)) return;
      let changed = false;
      const migrated = records.map(record => {
          const ac = record.assetClass;
          if (ac === CRYPTO_ASSET_CLASS || ac === STOCK_ASSET_CLASS || ac === UNKNOWN_ASSET_CLASS) return record;
          changed = true;
          const symbol = String(record.symbol || "").toUpperCase();
          const assetClass = KNOWN_CRYPTO_SYMBOLS.has(symbol) ? CRYPTO_ASSET_CLASS : UNKNOWN_ASSET_CLASS;
          return { ...record, assetClass };
      });
      if (!changed) return;
      window.localStorage.setItem(TRADE_JOURNAL_STORAGE_KEY, JSON.stringify(migrated));
      const unknownCount = migrated.filter(r => r.assetClass === UNKNOWN_ASSET_CLASS).length;
      if (unknownCount) console.warn(`SixQuant migration: ${unknownCount} record(s) tagged "unknown" — review asset class in Journal.`);
  }
  ```

- [ ] **Step 2: Call migration in boot()**

  Find `async function boot()`. Add `migrateAssetClassTags();` as the very first line inside the function:
  ```js
  async function boot() {
      migrateAssetClassTags();
      const markets = await getMarkets();
  ```

- [ ] **Step 3: Call migration in initJournalControls()**

  Find `function initJournalControls()`. Add `migrateAssetClassTags();` as first line:
  ```js
  function initJournalControls() {
      migrateAssetClassTags();
      const form = document.getElementById("journal-form");
  ```

- [ ] **Step 4: Browser console verify**

  Open journal.html in private mode, switch to Private Local Mode. In console:
  ```js
  // Manually set a record without assetClass
  localStorage.setItem("sixquant.tradeJournal.v1", JSON.stringify([{id:"T1",symbol:"BTC",entryPrice:50000,positionSize:1000}]));
  migrateAssetClassTags();
  JSON.parse(localStorage.getItem("sixquant.tradeJournal.v1"))[0].assetClass
  // Expected: "crypto"
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add app.js
  git commit -m "feat: add assetClass migration pass for legacy records"
  ```

---

## Task 4: Journal Filter Bar

**Files:**
- Modify: `journal.html`
- Modify: `app.js`

**Context:** journal.html has `<section class="welcome">` followed by `<section class="panel journal-panel">` (the form). Filter bar goes between them. `renderJournal()` at line 2660. `initJournalControls()` at line 2795.

- [ ] **Step 1: Add filter bar HTML to journal.html**

  In `journal.html`, find this line:
  ```html
  <section class="panel journal-panel">
      <div class="panel-header">
          <h2 class="panel-title">Add / Edit Trade</h2>
  ```
  Add the filter bar section BEFORE it:
  ```html
  <section class="panel">
      <div class="panel-body">
          <div class="journal-filter-bar" role="group" aria-label="Asset class filter">
              <span style="font-size:12px;font-weight:600;color:var(--muted);margin-right:4px;">Filter:</span>
              <button class="filter-btn active" type="button" data-filter="all">All</button>
              <button class="filter-btn" type="button" data-filter="crypto">Crypto</button>
              <button class="filter-btn" type="button" data-filter="stock">Stocks</button>
          </div>
      </div>
  </section>
  ```

- [ ] **Step 2: Add currentJournalFilter() to app.js**

  Add after the `currentReportAssetFilter()` function (line 714):
  ```js
  function currentJournalFilter() {
      try { return sessionStorage.getItem(JOURNAL_FILTER_KEY) || "all"; } catch { return "all"; }
  }
  ```

- [ ] **Step 3: Add initJournalFilterBar() to app.js**

  Add after `currentJournalFilter()`:
  ```js
  function initJournalFilterBar() {
      const btns = document.querySelectorAll("[data-filter]");
      if (!btns.length) return;
      const active = currentJournalFilter();
      btns.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.filter === active);
          btn.addEventListener("click", () => {
              try { sessionStorage.setItem(JOURNAL_FILTER_KEY, btn.dataset.filter); } catch {}
              btns.forEach(b => b.classList.toggle("active", b === btn));
              renderJournal();
          });
      });
  }
  ```

- [ ] **Step 4: Update renderJournal() to use filter**

  Find `function renderJournal()` (line 2660). Change the `const trades = sharedJournalTrades();` line and the two filtered arrays:

  Replace:
  ```js
  const trades = sharedJournalTrades();
  const openRows = trades.filter(trade => trade.status !== "closed");
  const closedRows = trades.filter(trade => trade.status === "closed");
  ```
  With:
  ```js
  const allTrades = sharedJournalTrades();
  const trades = filterTradesByAssetClass(allTrades, currentJournalFilter());
  const openRows = trades.filter(trade => trade.status !== "closed");
  const closedRows = trades.filter(trade => trade.status === "closed");
  ```

- [ ] **Step 5: Call initJournalFilterBar() in initJournalControls()**

  In `initJournalControls()`, after `migrateAssetClassTags();`, add:
  ```js
  initJournalFilterBar();
  ```

- [ ] **Step 6: Manual verify**

  Open `journal.html`. Three filter buttons should appear. Click "Crypto" — only crypto rows show. Click "Stocks" — only stock rows show (unknown rows always show). Click "All" — everything shows. Refresh page — filter resets to "All" (sessionStorage cleared).

- [ ] **Step 7: Commit**

  ```bash
  git add journal.html app.js
  git commit -m "feat: add asset class filter bar to journal"
  ```

---

## Task 5: Settings PAT Input

**Files:**
- Modify: `settings.html`
- Modify: `app.js`

- [ ] **Step 1: Add PAT functions to app.js**

  Add after `savePortalMode()` function:
  ```js
  function loadGithubPat() {
      if (isPublicDemoMode()) return "";
      if (!storageAvailable()) return "";
      try { return window.localStorage.getItem(GITHUB_PAT_STORAGE_KEY) || ""; } catch { return ""; }
  }

  function saveGithubPat(pat) {
      if (isPublicDemoMode()) return false;
      if (!storageAvailable()) return false;
      try {
          if (pat) window.localStorage.setItem(GITHUB_PAT_STORAGE_KEY, pat);
          else window.localStorage.removeItem(GITHUB_PAT_STORAGE_KEY);
          return true;
      } catch { return false; }
  }
  ```

- [ ] **Step 2: Add initSettingsPage() to app.js**

  Add before `boot()`:
  ```js
  function initSettingsPage() {
      if (page !== "settings") return;
      const patInput = document.getElementById("github-pat-input");
      const patMsg = document.getElementById("github-pat-message");
      const patSave = document.getElementById("github-pat-save");
      const patClear = document.getElementById("github-pat-clear");
      if (!patInput) return;
      if (isPublicDemoMode()) {
          patInput.disabled = true;
          if (patMsg) patMsg.textContent = "GitHub sharing requires Private Local Mode.";
          return;
      }
      patInput.value = loadGithubPat() ? "••••••••••••••••" : "";
      patSave?.addEventListener("click", () => {
          const val = patInput.value.trim();
          if (!val || val === "••••••••••••••••") return;
          if (saveGithubPat(val)) {
              patInput.value = "••••••••••••••••";
              if (patMsg) { patMsg.textContent = "PAT saved."; patMsg.className = "form-message"; }
          }
      });
      patClear?.addEventListener("click", () => {
          saveGithubPat("");
          patInput.value = "";
          if (patMsg) { patMsg.textContent = "PAT cleared."; patMsg.className = "form-message"; }
      });
  }
  ```

- [ ] **Step 3: Call initSettingsPage() at bottom of app.js**

  Find the `document.addEventListener("DOMContentLoaded", ...)` block at the bottom, or add:
  ```js
  initSettingsPage();
  ```
  Just before or after `initPortalModeControls();` and `initPrivacyToggle();` calls (find these near the bottom of app.js).

- [ ] **Step 4: Add Share Settings section to settings.html**

  In `settings.html`, find the `<section class="panel rule-banner">` block. Add the Share Settings section BEFORE it:
  ```html
  <section class="panel">
      <div class="panel-header">
          <h2 class="panel-title">Share Settings</h2>
          <p class="panel-subtitle">GitHub PAT for Gist sharing — Private Local Mode only</p>
      </div>
      <div class="panel-body">
          <p>To share trade snapshots via GitHub Gist, provide a GitHub Personal Access Token with <strong>gist</strong> scope. The token is stored in this browser only and never committed or transmitted except to <code>api.github.com</code>.</p>
          <p>Create a token at <strong>github.com → Settings → Developer settings → Personal access tokens</strong>. Select only the <code>gist</code> scope.</p>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;">
              <input id="github-pat-input" type="password" placeholder="ghp_••••••••••••••••" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid var(--line);border-radius:6px;font-size:13px;">
              <button id="github-pat-save" class="button-primary" type="button">Save PAT</button>
              <button id="github-pat-clear" class="table-action" type="button">Clear</button>
          </div>
          <p class="form-message" id="github-pat-message" aria-live="polite"></p>
      </div>
  </section>
  ```

- [ ] **Step 5: Manual verify**

  Open `settings.html` in Public Demo Mode. PAT input should be disabled with message "GitHub sharing requires Private Local Mode." Switch to Private Local Mode. Input should be enabled. Enter a fake PAT, click Save — should show "PAT saved." and mask to bullets.

- [ ] **Step 6: Commit**

  ```bash
  git add settings.html app.js
  git commit -m "feat: add GitHub PAT settings for Gist share"
  ```

---

## Task 6: Share Panel HTML

**Files:**
- Modify: `journal.html`

- [ ] **Step 1: Add share toolbar above All Journal Records table**

  In `journal.html`, find:
  ```html
  <section class="panel journal-panel">
      <div class="panel-header">
          <h2 class="panel-title">All Journal Records</h2>
  ```
  Replace with:
  ```html
  <section class="panel journal-panel">
      <div class="panel-header">
          <h2 class="panel-title">All Journal Records</h2>
          <p class="panel-subtitle">Crypto and stock records with full review fields</p>
      </div>
      <div class="share-toolbar" id="share-toolbar">
          <button class="table-action" type="button" id="share-toggle-btn">Share</button>
          <span id="share-selected-count" style="font-size:12px;color:var(--muted);display:none;">0 selected</span>
          <button class="button-primary" type="button" id="share-configure-btn" style="display:none;" disabled>Configure Share</button>
      </div>
  ```
  
  Note: Remove the duplicate `<p class="panel-subtitle">` that was already there.

- [ ] **Step 2: Add checkbox column to All Journal Records table**

  In `journal.html`, find the `<thead>` row of the All Journal Records table:
  ```html
  <thead><tr><th>Class</th><th>Symbol / Ticker</th>...
  ```
  Replace with:
  ```html
  <thead><tr><th class="share-checkbox-col" id="share-all-th" style="display:none;"><input type="checkbox" id="share-select-all" aria-label="Select all"></th><th>Class</th><th>Symbol / Ticker</th><th>Entry</th><th class="num">Entry price</th><th class="num">Position size</th><th>Signal</th><th>Consensus</th><th>Reason</th><th>Invalidation</th><th>Exit</th><th class="num">Exit price</th><th>Exit reason</th><th>Result</th><th>Plan?</th><th>SixQuant?</th><th>Mistake</th><th>Lesson</th><th>Notes</th></tr></thead>
  ```

- [ ] **Step 3: Add share modal HTML before closing </main>**

  In `journal.html`, add before `</main>`:
  ```html
  <div class="share-modal-overlay" id="share-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <div class="share-modal">
          <h3 id="share-modal-title">Configure Share</h3>
          <p style="font-size:12px;color:var(--muted);margin:0 0 14px;">Select which fields to include for all selected trades.</p>
          <div class="share-fields-grid">
              <label class="share-field-check"><input type="checkbox" id="sf-symbol" checked disabled> Symbol</label>
              <label class="share-field-check"><input type="checkbox" id="sf-direction" checked disabled> Direction</label>
              <label class="share-field-check"><input type="checkbox" id="sf-date" checked disabled> Date</label>
              <label class="share-field-check"><input type="checkbox" id="sf-quantity"> Quantity</label>
              <label class="share-field-check"><input type="checkbox" id="sf-entry-price"> Entry price</label>
              <label class="share-field-check"><input type="checkbox" id="sf-pnl"> P&amp;L</label>
              <label class="share-field-check"><input type="checkbox" id="sf-notes"> Notes</label>
          </div>
          <div class="share-warning" id="share-warning-box" style="display:none;">
              <strong>Warning:</strong> Secret Gists are accessible to anyone with the URL. Do not share sensitive financial data you are not comfortable making accessible.
          </div>
          <div class="share-result" id="share-result-box" style="display:none;"></div>
          <div class="share-error" id="share-error-box" style="display:none;"></div>
          <div class="share-modal-actions">
              <button class="table-action" type="button" id="share-modal-close">Cancel</button>
              <button class="button-primary" type="button" id="share-confirm-btn">Create Gist</button>
          </div>
      </div>
  </div>
  ```

- [ ] **Step 4: Manual verify HTML**

  Open `journal.html`. Share toolbar should be visible above All Journal Records. Modal should not be visible. Right-click inspect — confirm modal overlay div is in DOM.

- [ ] **Step 5: Commit**

  ```bash
  git add journal.html
  git commit -m "feat: add share toolbar and modal HTML to journal"
  ```

---

## Task 7: Share Panel JS

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add buildGistPayload() function**

  Add before `boot()`:
  ```js
  function buildGistPayload(trades, fields) {
      const rows = trades.map(trade => {
          const obj = {};
          obj.symbol = trade.symbol;
          if (fields.direction) obj.direction = trade.status === "closed"
              ? (trade.resultAud > 0 ? "buy-win" : trade.resultAud < 0 ? "buy-loss" : "buy-closed")
              : "buy-open";
          if (fields.date) obj.date = trade.entryDate ? trade.entryDate.slice(0, 10) : "";
          if (fields.quantity) obj.quantity = trade.positionSize;
          if (fields.entryPrice) obj.entry_price = trade.entryPrice;
          if (fields.pnl && trade.resultAud !== null) obj.pnl_aud = trade.resultAud;
          if (fields.notes && trade.notes) obj.notes = trade.notes;
          return obj;
      });
      const classes = [...new Set(trades.map(t => t.assetClass))];
      return {
          sixquant_export: true,
          exported_at: new Date().toISOString(),
          asset_class_filter: classes.length === 1 ? classes[0] : "mixed",
          trades: rows
      };
  }
  ```

- [ ] **Step 2: Add createGist() async function**

  Add after `buildGistPayload()`:
  ```js
  async function createGist(payload) {
      const pat = loadGithubPat();
      if (!pat) throw new Error("No GitHub PAT saved. Add one in Settings → Share Settings.");
      const body = {
          description: "SixQuant Trading OS — shared trade snapshot",
          public: false,
          files: { "sixquant-trades.json": { content: JSON.stringify(payload, null, 2) } }
      };
      const response = await fetch("https://api.github.com/gists", {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${pat}`,
              "Accept": "application/vnd.github+json",
              "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
      });
      if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `GitHub API error ${response.status}`);
      }
      const data = await response.json();
      return data.html_url;
  }
  ```

- [ ] **Step 3: Add initSharePanel() function**

  Add after `createGist()`:
  ```js
  function initSharePanel() {
      if (page !== "journal") return;

      const toggleBtn = document.getElementById("share-toggle-btn");
      const configureBtn = document.getElementById("share-configure-btn");
      const selectedCount = document.getElementById("share-selected-count");
      const overlay = document.getElementById("share-modal-overlay");
      const closeBtn = document.getElementById("share-modal-close");
      const confirmBtn = document.getElementById("share-confirm-btn");
      const warningBox = document.getElementById("share-warning-box");
      const resultBox = document.getElementById("share-result-box");
      const errorBox = document.getElementById("share-error-box");
      const selectAllCb = document.getElementById("share-select-all");
      const allTh = document.getElementById("share-all-th");

      if (!toggleBtn) return;

      let shareMode = false;
      let confirmed = false;

      function getSelectedIds() {
          return [...document.querySelectorAll(".share-row-cb:checked")].map(cb => cb.dataset.tradeId);
      }

      function updateShareCount() {
          const ids = getSelectedIds();
          const count = ids.length;
          if (selectedCount) {
              selectedCount.textContent = `${count} selected`;
              selectedCount.style.display = shareMode ? "inline" : "none";
          }
          if (configureBtn) {
              configureBtn.style.display = shareMode ? "inline-flex" : "none";
              configureBtn.disabled = count === 0;
          }
      }

      function toggleShareMode() {
          shareMode = !shareMode;
          toggleBtn.textContent = shareMode ? "Cancel Share" : "Share";
          toggleBtn.classList.toggle("danger-action", shareMode);
          if (allTh) allTh.style.display = shareMode ? "" : "none";
          document.querySelectorAll(".share-checkbox-col-cell").forEach(td => {
              td.style.display = shareMode ? "" : "none";
          });
          if (!shareMode && selectAllCb) selectAllCb.checked = false;
          updateShareCount();
      }

      toggleBtn.addEventListener("click", toggleShareMode);

      document.getElementById("all-journal-body").addEventListener("change", event => {
          if (event.target.classList.contains("share-row-cb")) updateShareCount();
      });

      if (selectAllCb) {
          selectAllCb.addEventListener("change", () => {
              document.querySelectorAll(".share-row-cb").forEach(cb => { cb.checked = selectAllCb.checked; });
              updateShareCount();
          });
      }

      configureBtn?.addEventListener("click", () => {
          confirmed = false;
          if (warningBox) warningBox.style.display = "block";
          if (resultBox) { resultBox.style.display = "none"; resultBox.textContent = ""; }
          if (errorBox) { errorBox.style.display = "none"; errorBox.textContent = ""; }
          if (confirmBtn) confirmBtn.textContent = "Create Gist";
          overlay?.classList.add("open");
      });

      closeBtn?.addEventListener("click", () => overlay?.classList.remove("open"));
      overlay?.addEventListener("click", event => { if (event.target === overlay) overlay.classList.remove("open"); });

      confirmBtn?.addEventListener("click", async () => {
          if (!confirmed) {
              confirmed = true;
              if (confirmBtn) confirmBtn.textContent = "Confirm & Create";
              return;
          }
          const ids = getSelectedIds();
          const allTrades = sharedJournalTrades();
          const selectedTrades = allTrades.filter(t => ids.includes(t.id));
          if (!selectedTrades.length) {
              if (errorBox) { errorBox.textContent = "No trades selected."; errorBox.style.display = "block"; }
              return;
          }
          const fields = {
              direction: document.getElementById("sf-direction")?.checked ?? true,
              date: document.getElementById("sf-date")?.checked ?? true,
              quantity: document.getElementById("sf-quantity")?.checked ?? false,
              entryPrice: document.getElementById("sf-entry-price")?.checked ?? false,
              pnl: document.getElementById("sf-pnl")?.checked ?? false,
              notes: document.getElementById("sf-notes")?.checked ?? false
          };
          if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = "Creating…"; }
          try {
              const payload = buildGistPayload(selectedTrades, fields);
              const url = await createGist(payload);
              try { await navigator.clipboard.writeText(url); } catch {}
              if (resultBox) {
                  resultBox.innerHTML = `Gist created. Link copied to clipboard.<br><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
                  resultBox.style.display = "block";
              }
              if (warningBox) warningBox.style.display = "none";
              if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = "Done"; }
          } catch (err) {
              if (errorBox) { errorBox.textContent = `Error: ${err.message}`; errorBox.style.display = "block"; }
              if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "Confirm & Create"; }
          }
      });
  }
  ```

- [ ] **Step 4: Add checkbox cells to renderJournal() all-trades table**

  In `renderJournal()`, find the `allBody.innerHTML = trades.length ? trades.map(trade => ...` block (line ~2670). In the template literal, add a checkbox `<td>` as the FIRST cell:

  Replace the opening `<tr>` mapping in `allBody.innerHTML`:
  ```js
  allBody.innerHTML = trades.length ? trades.map(trade => `
      <tr>
          <td class="share-checkbox-col-cell" style="display:none;"><input type="checkbox" class="share-row-cb" data-trade-id="${escapeHtml(trade.id)}" aria-label="Select trade ${escapeHtml(trade.id)}"></td>
          <td>${assetClassBadge(trade.assetClass)}</td>
  ```
  (Replace the first two lines of the existing template literal — add the checkbox td before the existing `<td>${assetClassBadge(...` line.)

- [ ] **Step 5: Call initSharePanel() in initJournalControls()**

  In `initJournalControls()`, after `initJournalFilterBar();`, add:
  ```js
  initSharePanel();
  ```

- [ ] **Step 6: Manual verify share flow**

  Open `journal.html` in Private Local Mode with at least one demo record visible. Click "Share" — checkbox column appears. Check one trade — "0 selected" updates, "Configure Share" enables. Click "Configure Share" — modal opens with warning and field toggles. Click "Create Gist" — "Confirm & Create" appears. (Without a real PAT, clicking Confirm will show error "No GitHub PAT saved..." — expected.) Close modal.

- [ ] **Step 7: Commit**

  ```bash
  git add app.js
  git commit -m "feat: add Gist share panel to journal — select trades, configure fields, post to GitHub"
  ```

---

## Task 8: Deploy & Smoke Test

- [ ] **Step 1: Update CSS version bust in all HTML files**

  In `index.html`, `journal.html`, `reports.html`, `settings.html`, `stocks.html`, `guide.html`, `alerts.html`, `logs.html`: change the CSS query string from `?v=package1-nav-20260525` to `?v=share-20260526`.

  Also update app.js script tag version strings to match.

- [ ] **Step 2: Push to GitHub Pages**

  ```bash
  git add .
  git commit -m "chore: version bust for share release"
  git push origin main
  ```

- [ ] **Step 3: Smoke test checklist on live GitHub Pages URL**

  - [ ] Journal filter bar renders — All/Crypto/Stocks buttons visible
  - [ ] Crypto filter shows only crypto + unknown records
  - [ ] Stocks filter shows only stock + unknown records
  - [ ] Filter resets on new tab
  - [ ] Share button appears above All Journal Records
  - [ ] Clicking Share shows checkboxes
  - [ ] Checking a record enables "Configure Share"
  - [ ] Modal opens with warning and field toggles
  - [ ] Without PAT: error message shown, no crash
  - [ ] Settings page: PAT input present, disabled in demo mode
  - [ ] Reports asset-class filter still works (regression check)
  - [ ] Unknown badge renders amber if any unknown records exist

- [ ] **Step 4: Done** — All checklist items pass, plan complete.
