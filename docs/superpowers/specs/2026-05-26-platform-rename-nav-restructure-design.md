# ZenCloud Trading OS — Platform Rename & Nav Restructure

**Date:** 2026-05-26  
**Status:** Approved  
**Deployment:** GitHub Pages (static, no backend)

---

## Scope

Standardise platform name to "ZenCloud Trading OS" across all pages and restructure navigation to be context-sensitive per workspace, with a workspace switcher and vertical divider on shared pages.

Out of scope: JS changes, new pages, new data features, backend.

---

## 1. Name Standardisation

Replace all occurrences of "ZenCloud Crypto Dashboard" with "ZenCloud Trading OS". Update `<title>` tags to `{Page} — ZenCloud Trading OS` format.

| File | `<title>` | Brand `<span>` text | Brand `aria-label` |
|---|---|---|---|
| `index.html` | `Crypto Workspace — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |
| `stocks.html` | `Stocks Workspace — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |
| `logs.html` | `Market Logs — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |
| `alerts.html` | `Alerts — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |
| `journal.html` | `Journal — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |
| `reports.html` | `Reports — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |
| `guide.html` | `Guide — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |
| `settings.html` | `Settings — ZenCloud Trading OS` | `ZenCloud Trading OS` | `ZenCloud Trading OS` |

---

## 2. Nav Structure

Three static nav variants — one per page group. All implemented as hand-crafted HTML per page (no JS nav rendering). Settings link added to every page's nav.

### 2a. Crypto Workspace (`index.html`)

Crypto workspace button active. Content links follow directly.

```
Z ZenCloud Trading OS  |  [Crypto ✓]  Logs  Alerts  Journal  Reports  Guide  Settings
```

HTML structure:
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

### 2b. Stocks Workspace (`stocks.html`)

Stocks workspace button active. Same content links.

```
Z ZenCloud Trading OS  |  [Stocks ✓]  Logs  Alerts  Journal  Reports  Guide  Settings
```

HTML structure: identical to 2a with `active` on Stocks button instead.

### 2c. Shared Pages (`logs.html`, `alerts.html`, `journal.html`, `reports.html`, `guide.html`, `settings.html`)

Both workspace buttons shown as switcher (neither active). Vertical divider separates workspace group from content links. Current page link carries `.active`.

```
Z ZenCloud Trading OS  |  [Crypto]  [Stocks]  ╎  Logs ✓  Alerts  Journal  Reports  Guide  Settings
```

HTML structure:
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

(`.active` moves to the current page's link on each file.)

---

## 3. CSS Additions

Three new rules appended to `styles.css`. No existing rules modified.

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

---

## Files Changed

| File | Change |
|---|---|
| `styles.css` | Add `.nav-workspace-btn`, `.nav-workspace-btn.active`, `.nav-divider` |
| `index.html` | Title, brand text, aria-label, nav HTML (workspace variant) |
| `stocks.html` | Title, brand text, aria-label, nav HTML (workspace variant) |
| `logs.html` | Title, brand text, aria-label, nav HTML (shared variant, Logs active) |
| `alerts.html` | Title, brand text, aria-label, nav HTML (shared variant, Alerts active) |
| `journal.html` | Title, brand text, nav HTML (shared variant, Journal active) |
| `reports.html` | Title, brand text, nav HTML (shared variant, Reports active) |
| `guide.html` | Title, brand text, nav HTML (shared variant, Guide active) |
| `settings.html` | Title, brand text, nav HTML (shared variant, Settings active) |

No new files. No JS changes. No new dependencies.

---

## Testing Checklist

- [ ] All 8 page titles read `{Page} — ZenCloud Trading OS`
- [ ] Brand text reads "ZenCloud Trading OS" on all pages
- [ ] Crypto workspace button active (blue) on `index.html` only
- [ ] Stocks workspace button active (blue) on `stocks.html` only
- [ ] Neither workspace button active on shared pages
- [ ] Divider visible between workspace buttons and content links on shared pages
- [ ] Correct content link active on each shared page
- [ ] Settings link present and functional on all 8 pages
- [ ] No broken links
