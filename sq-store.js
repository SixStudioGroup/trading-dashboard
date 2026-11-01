// SixQuant browser layer shared by Today and Scan: settings, trade records, feed
// loading and the data-trust bar. Records stay in this browser. Demo mode never
// writes trades to storage.
(function () {
    const SQ = window.SQ;
    const { KEYS } = SQ;

    function read(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch {
            return fallback;
        }
    }
    function write(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }
    function isPrivate() {
        try { return window.localStorage.getItem(KEYS.portalMode) === "private"; } catch { return false; }
    }
    function setPrivate(value) {
        try { window.localStorage.setItem(KEYS.portalMode, value ? "private" : "demo"); } catch { /* storage off */ }
    }
    function hideValues() {
        try { return window.localStorage.getItem(KEYS.hideValues) === "true"; } catch { return false; }
    }
    function setHideValues(value) {
        try { window.localStorage.setItem(KEYS.hideValues, value ? "true" : "false"); } catch { /* storage off */ }
    }
    function account() {
        return { ...SQ.DEFAULT_ACCOUNT, ...(read(KEYS.account, {}) || {}) };
    }
    function saveAccount(patch) {
        return write(KEYS.account, { ...account(), ...patch });
    }
    function rules() {
        return { ...SQ.DEFAULT_RULES, ...(read(KEYS.riskRules, {}) || {}) };
    }
    function fees() {
        return { ...SQ.DEFAULT_FEES, ...(read(KEYS.feeDefaults, {}) || {}) };
    }

    const DEMO_TRADES = [
        { id: "STOCK-DEMO-1", symbol: "BHP", name: "BHP Group (demo)", sector: "Materials", mode: "paper", status: "open", state: "Watch", referencePrice: 55, fillPrice: 55.2, units: 60, positionSize: 3312, invalidationPrice: 52.5, targetPrice: 61, brokerageFee: 5, feePercent: 0, spreadPercent: 0.1, whyNow: "Demo trade: workflow preview only", entryTrigger: "Demo trigger", recordedAt: "2026-10-26T18:00:00+11:00", fillDate: "2026-10-27T10:30:00+11:00" },
        { id: "STOCK-DEMO-2", symbol: "CSL", name: "CSL (demo)", sector: "Health Care", mode: "paper", status: "planned", state: "Watch", referencePrice: 150, units: 20, positionSize: 3000, invalidationPrice: 143, targetPrice: 165, brokerageFee: 5, feePercent: 0, spreadPercent: 0.1, whyNow: "Demo plan: workflow preview only", entryTrigger: "Demo trigger", recordedAt: "2026-10-30T18:00:00+11:00" }
    ];
    let demoTrades = DEMO_TRADES.map(SQ.normalizeStockTrade);

    function stockTrades() {
        if (!isPrivate()) return demoTrades;
        const rows = read(KEYS.stockPlans, []);
        return Array.isArray(rows) ? rows.map(SQ.normalizeStockTrade) : [];
    }
    function saveStockTrades(rows) {
        if (!isPrivate()) {
            demoTrades = rows;
            return true;
        }
        return write(KEYS.stockPlans, rows);
    }
    function upsertTrade(trade) {
        const rows = stockTrades();
        const index = rows.findIndex(row => row.id === trade.id);
        if (index >= 0) rows[index] = trade;
        else rows.unshift(trade);
        return saveStockTrades(rows);
    }
    function removeTrade(id) {
        return saveStockTrades(stockTrades().filter(row => row.id !== id));
    }

    async function fetchJson(url) {
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }
    async function loadFeed() {
        try {
            return await fetchJson("data/asx-feed.json");
        } catch {
            return { mode: "offline", assets: [] };
        }
    }
    async function loadHistory() {
        try {
            return (await fetchJson("data/asx-history.json")).series || {};
        } catch {
            return {};
        }
    }
    async function loadHeartbeat(feed) {
        try {
            return await fetchJson(`data/heartbeat-${feed}.json`);
        } catch {
            return null;
        }
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
    }
    function money(value, opts = {}) {
        if (hideValues() && !opts.always) return "$....";
        const n = Number(value);
        const text = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number.isFinite(n) ? n : 0);
        return opts.signed && n > 0 ? `+${text}` : text;
    }
    function price(value) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? `$${n.toFixed(n < 10 ? 3 : 2)}` : "n/a";
    }
    function rText(value) {
        return Number.isFinite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(2)}R` : "n/a";
    }
    function shortDate(value) {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? "n/a" : d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
    }

    function renderDataBar(el, freshness, extra = "") {
        if (!el) return;
        el.className = `sq-data-bar sq-data-${freshness.state}`;
        el.innerHTML = `<strong>${escapeHtml(freshness.label)}</strong><span>${escapeHtml(freshness.detail || "")}${extra ? ` ${escapeHtml(extra)}` : ""}</span>`;
    }

    function downloadFile(name, content, type) {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
    function dateStamp() {
        return SQ.sydneyParts(new Date()).key;
    }
    function downloadBackup() {
        const backup = SQ.buildBackup(window.localStorage);
        downloadFile(`sixquant-backup-${dateStamp()}.json`, JSON.stringify(backup, null, 2), "application/json");
        saveAccount({ lastBackupAt: new Date().toISOString() });
    }
    function backupOverdue() {
        if (!isPrivate() || !stockTrades().length) return false;
        const last = new Date(account().lastBackupAt).getTime();
        return !Number.isFinite(last) || Date.now() - last > 7 * 86400000;
    }

    // Mode and privacy controls for pages that do not load app.js.
    function initTopbarControls(onChange) {
        const topbar = document.querySelector(".topbar");
        if (!topbar || document.getElementById("portal-mode-select")) return;
        const mode = document.createElement("label");
        mode.className = "privacy-toggle";
        mode.innerHTML = `<span>Mode</span><select id="portal-mode-select" aria-label="Portal privacy mode"><option value="demo">Public Demo</option><option value="private">Private Local</option></select>`;
        const privacy = document.createElement("label");
        privacy.className = "privacy-toggle";
        privacy.innerHTML = `<input id="hide-values-toggle" type="checkbox"><span>Hide Values</span>`;
        topbar.append(mode, privacy);
        const select = mode.querySelector("select");
        const box = privacy.querySelector("input");
        select.value = isPrivate() ? "private" : "demo";
        box.checked = hideValues();
        const apply = () => {
            document.body.classList.toggle("public-demo-mode", !isPrivate());
            document.body.classList.toggle("private-local-mode", isPrivate());
            document.body.classList.toggle("values-hidden", hideValues());
        };
        apply();
        select.addEventListener("change", () => { setPrivate(select.value === "private"); apply(); onChange?.(); });
        box.addEventListener("change", () => { setHideValues(box.checked); apply(); onChange?.(); });
    }

    SQ.store = {
        read, write, isPrivate, setPrivate, hideValues, setHideValues, account, saveAccount, rules, fees,
        stockTrades, saveStockTrades, upsertTrade, removeTrade,
        loadFeed, loadHistory, loadHeartbeat,
        escapeHtml, money, price, rText, shortDate, renderDataBar,
        downloadFile, dateStamp, downloadBackup, backupOverdue, initTopbarControls
    };
})();
