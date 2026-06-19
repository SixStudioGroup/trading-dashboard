# SixQuant Trading OS — Schema Fix, Asset Filtering & Gist Share

**Date:** 2026-05-26  
**Status:** Approved  
**Deployment:** GitHub Pages (static, no backend)

---

## Scope

Three improvements to SixQuant Trading OS:

1. Fix data overlap between Crypto and Stocks workspaces via strict `assetClass` schema
2. Add asset-class filter UI to Journal and Reports pages
3. Add GitHub Gist-based read-only share panel to Journal

Out of scope: authentication, 2FA, server-side storage, multi-user accounts, share.html renderer.

---

## 1. Data Schema & Overlap Prevention

### Schema requirement

All trade journal records require `assetClass: "crypto" | "stocks"`. Records without it are invalid going forward.

### Migration

On app init, a one-time migration pass runs against localStorage records:

- Known crypto symbols (BTC, ETH, BNB, ADA, DOT, LTC, XLM, DOGE, THETA, FET, etc.) → `assetClass: "crypto"`
- All other symbols → `assetClass: "stocks"` if they match ASX/NYSE/NASDAQ ticker patterns, else `assetClass: "unknown"`
- Records already tagged are skipped
- Migration result logged to console; records tagged `"unknown"` surfaced in UI

### Enforcement

New records written without `assetClass` are rejected:
```js
if (!record.assetClass || !['crypto','stocks'].includes(record.assetClass)) {
  console.error('Invalid record: missing assetClass', record);
  return;
}
```

### Rendering isolation

- Crypto Workspace: renders only `assetClass === "crypto"` records
- Stocks Workspace: renders only `assetClass === "stocks"` records
- Records with `assetClass === "unknown"` shown in both workspaces with a yellow warning badge

---

## 2. Asset-Class Filtering — Journal & Reports

### Filter bar

Three toggle buttons added above the records list on both `journal.html` and `reports.html`:

```
[ All ]  [ Crypto ]  [ Stocks ]
```

Default: **All** (existing behaviour preserved).

### Behaviour

- Filter selection persists in `sessionStorage` (resets on tab close)
- Toggle triggers JS filter: rows/cards get `data-asset-class` attribute; non-matching rows get CSS class `hidden`
- No page reload
- Active filter visually indicated (button highlight)
- Report totals (P&L, trade count, win rate) recalculate based on visible records only
- `"unknown"` records always visible regardless of filter — yellow badge prompts resolution

### Implementation

Pure JS, no new dependencies. Filter logic in `journal.html` inline script or new `journal.js`. Reports equivalent in `reports.html`.

---

## 3. GitHub Gist Share Panel

### PAT Setup (Settings page)

- New "Share Settings" section in `settings.html`
- User pastes GitHub PAT with `gist` scope
- Stored in localStorage key `sixquant.githubPat.v1`
- Blocked in demo mode — error shown: "GitHub sharing requires Private Local Mode"
- PAT field is `type="password"`, never logged

### Share workflow (Journal page)

**Step 1 — Enable share mode**
- "Share" button in journal toolbar toggles checkbox column on all trade rows

**Step 2 — Select trades**
- User checks trades to include
- "Configure Share" button activates when ≥1 trade selected

**Step 3 — Field selection modal**

Modal shows per-trade field toggles (applied globally to all selected trades):

| Field | Default |
|---|---|
| Symbol | ✓ on |
| Direction (buy/sell) | ✓ on |
| Date | ✓ on |
| Quantity | opt (off) |
| Entry price | opt (off) |
| P&L | opt (off) |
| Notes | opt (off) |

**Step 4 — Create Gist**
- "Create Gist" button
- Warning displayed before POST: "Secret Gists are accessible to anyone with the URL. Do not share sensitive financial data you are not comfortable making accessible."
- User must click "Confirm & Create" to proceed
- POST to `https://api.github.com/gists` with PAT in `Authorization: Bearer` header
- Payload: single file `sixquant-trades.json`, `public: false`
- On success: Gist URL copied to clipboard and displayed in modal
- On failure: error message shown with GitHub API error detail

### Gist payload structure

```json
{
  "sixquant_export": true,
  "exported_at": "2026-05-26T10:00:00+10:00",
  "asset_class_filter": "crypto",
  "trades": [
    {
      "symbol": "BTC",
      "direction": "buy",
      "date": "2026-05-01"
    }
  ]
}
```

Only fields the user enabled appear in each trade object.

### Security constraints

- PAT read from localStorage only at share-creation time; not cached in module scope
- Demo mode: share panel entirely hidden
- Secret Gist warning is mandatory (cannot be dismissed without confirming)
- No PAT transmission except to `api.github.com`

---

## Files Changed

| File | Change |
|---|---|
| `app.js` | Migration pass, schema enforcement, crypto symbol list |
| `stocks.js` | Rendering filter for `assetClass === "stocks"` |
| `journal.html` | Filter bar, share toolbar, share modal |
| `reports.html` | Filter bar, recalculate totals on filter |
| `settings.html` | Share Settings section (PAT input) |
| `styles.css` | Filter bar styles, share modal styles, unknown-badge styles |

No new files required. No backend. No new dependencies.

---

## Testing Checklist

- [ ] Migration correctly tags existing demo records
- [ ] Unknown records show yellow badge in both workspaces
- [ ] New record without `assetClass` is rejected
- [ ] Journal filter: All/Crypto/Stocks shows correct records
- [ ] Reports totals recalculate on filter change
- [ ] `sessionStorage` filter resets on new tab
- [ ] PAT blocked in demo mode
- [ ] Share modal warns before Gist POST
- [ ] Gist created successfully with correct fields
- [ ] Gist URL copied to clipboard
- [ ] Disabled fields absent from Gist JSON
- [ ] Deploy to GitHub Pages, smoke test on live URL
