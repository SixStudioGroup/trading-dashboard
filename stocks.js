const PORTAL_MODE_STORAGE_KEY = "zencloud.portalMode.v1";
const PRIVACY_STORAGE_KEY = "zencloud.hideValues.v1";
const PUBLIC_DEMO_MODE = "demo";
const PRIVATE_LOCAL_MODE = "private";
const STOCK_JOURNAL_STORAGE_KEY = "zencloud.stocks.tradeJournal.v1";
const STOCK_HOLDINGS_STORAGE_KEY = "zencloud.stocks.holdings.v1";
const MASTER_STOCK_RULE = "If the idea did not start in ZenCloud, do not execute it in the broker.";
const STOCK_PUBLIC_WARNING = "Public Demo Mode uses demo-only stock data. Private Local Mode stores stock records only in this browser.";

const DEMO_STOCKS = [
    { symbol: "BHP", name: "BHP Group", market: "ASX", state: "Momentum Review", score: 82, referencePrice: 43.2, reason: "Demo resources momentum review", invalidation: "Review if price loses the recorded support level" },
    { symbol: "CBA", name: "Commonwealth Bank", market: "ASX", state: "Watch", score: 74, referencePrice: 128.4, reason: "Demo bank strength watch", invalidation: "Review if sector breadth weakens" },
    { symbol: "CSL", name: "CSL", market: "ASX", state: "Risk Review", score: 61, referencePrice: 284.1, reason: "Demo healthcare volatility review", invalidation: "Review if thesis no longer matches price action" },
    { symbol: "WES", name: "Wesfarmers", market: "ASX", state: "Watch", score: 58, referencePrice: 69.8, reason: "Demo defensive watchlist candidate", invalidation: "Review if market context changes" },
    { symbol: "MQG", name: "Macquarie Group", market: "ASX", state: "No Action", score: 44, referencePrice: 198.7, reason: "Demo no-action example", invalidation: "No active plan" }
];

const DEMO_STOCK_JOURNAL = [
    {
        id: "STOCK-DEMO-1",
        symbol: "BHP",
        name: "BHP Group",
        market: "ASX",
        state: "Watch",
        referencePrice: 43.2,
        allocation: 1500,
        thesis: "Demo stock plan - workflow preview only",
        invalidation: "Demo invalidation level",
        brokerNote: "External broker placeholder only",
        fromZenCloud: true,
        recordedAt: "2026-05-12T09:30:00+10:00"
    }
];

const DEMO_STOCK_HOLDINGS = [
    { symbol: "BHP", name: "Demo BHP", market: "ASX", units: 20, avgEntryPrice: 41.5, referencePrice: 43.2, note: "Demo stock holding - not real trading data" },
    { symbol: "CBA", name: "Demo CBA", market: "ASX", units: 6, avgEntryPrice: 124.0, referencePrice: 128.4, note: "Demo stock holding - not real trading data" }
];

const brokerChecklistItems = [
    "Idea started in ZenCloud Stocks Workspace",
    "Thesis recorded",
    "Invalidation recorded",
    "Position size reviewed",
    "External broker details checked manually"
];

let portalMode = loadPortalMode();
let hideValues = loadPrivacyMode();
let selectedStockSymbol = "";
let completedBrokerChecks = new Set();
let stockJournal = loadCollection(STOCK_JOURNAL_STORAGE_KEY);
let stockHoldings = loadCollection(STOCK_HOLDINGS_STORAGE_KEY);

function storageAvailable() {
    try {
        const key = "__zencloud_stock_storage_test__";
        window.localStorage.setItem(key, key);
        window.localStorage.removeItem(key);
        return true;
    } catch (error) {
        return false;
    }
}

function loadPortalMode() {
    if (!storageAvailable()) return PUBLIC_DEMO_MODE;
    try {
        return window.localStorage.getItem(PORTAL_MODE_STORAGE_KEY) || PUBLIC_DEMO_MODE;
    } catch (error) {
        return PUBLIC_DEMO_MODE;
    }
}

function savePortalMode(value) {
    portalMode = value === PRIVATE_LOCAL_MODE ? PRIVATE_LOCAL_MODE : PUBLIC_DEMO_MODE;
    if (!storageAvailable()) return;
    try {
        window.localStorage.setItem(PORTAL_MODE_STORAGE_KEY, portalMode);
    } catch (error) {
        console.warn("Portal mode preference update skipped.");
    }
}

function isPublicDemoMode() {
    return portalMode !== PRIVATE_LOCAL_MODE;
}

function loadPrivacyMode() {
    if (!storageAvailable()) return false;
    try {
        return window.localStorage.getItem(PRIVACY_STORAGE_KEY) === "true";
    } catch (error) {
        return false;
    }
}

function savePrivacyMode(value) {
    hideValues = Boolean(value);
    if (!storageAvailable()) return;
    try {
        window.localStorage.setItem(PRIVACY_STORAGE_KEY, hideValues ? "true" : "false");
    } catch (error) {
        console.warn("Privacy preference update skipped.");
    }
}

function loadCollection(key) {
    if (isPublicDemoMode()) {
        if (key === STOCK_JOURNAL_STORAGE_KEY) return DEMO_STOCK_JOURNAL.map(normalizePlan);
        if (key === STOCK_HOLDINGS_STORAGE_KEY) return DEMO_STOCK_HOLDINGS.map(normalizeHolding);
        return [];
    }
    if (!storageAvailable()) return [];
    try {
        const stored = window.localStorage.getItem(key);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveCollection(key, rows) {
    const cleanRows = Array.isArray(rows) ? rows : [];
    if (isPublicDemoMode()) return cleanRows;
    if (!storageAvailable()) return cleanRows;
    try {
        window.localStorage.setItem(key, JSON.stringify(cleanRows));
    } catch (error) {
        console.warn("Local stock storage update skipped.");
    }
    return cleanRows;
}

function reloadStockData() {
    stockJournal = loadCollection(STOCK_JOURNAL_STORAGE_KEY);
    stockHoldings = loadCollection(STOCK_HOLDINGS_STORAGE_KEY);
    completedBrokerChecks = new Set();
}

function finiteNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[char]));
}

function formatMoney(value) {
    if (hideValues) return "$....";
    const numeric = finiteNumber(value);
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numeric);
}

function formatSignedMoney(value) {
    if (hideValues) return "$....";
    const numeric = finiteNumber(value);
    const prefix = numeric > 0 ? "+" : "";
    return `${prefix}${formatMoney(numeric)}`;
}

function formatUnits(value) {
    if (hideValues) return "....";
    return finiteNumber(value).toLocaleString("en-AU", { maximumFractionDigits: 6 });
}

function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    return date.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

function stockId() {
    return `STOCK-${Date.now().toString(36).toUpperCase()}`;
}

function normalizePlan(plan = {}) {
    const symbol = safeText(plan.symbol).toUpperCase();
    return {
        id: safeText(plan.id, stockId()),
        symbol,
        name: safeText(plan.name, symbol || "Unknown Stock"),
        market: safeText(plan.market, "Manual"),
        state: safeText(plan.state, "Watch"),
        referencePrice: Math.max(0, finiteNumber(plan.referencePrice)),
        allocation: Math.max(0, finiteNumber(plan.allocation)),
        thesis: safeText(plan.thesis, "Manual ZenCloud thesis required"),
        invalidation: safeText(plan.invalidation, "Manual invalidation required"),
        brokerNote: safeText(plan.brokerNote, "External broker placeholder only"),
        fromZenCloud: plan.fromZenCloud !== false,
        recordedAt: safeText(plan.recordedAt, new Date().toISOString())
    };
}

function normalizeHolding(holding = {}) {
    const symbol = safeText(holding.symbol).toUpperCase();
    return {
        symbol,
        name: safeText(holding.name, symbol || "Unknown Stock"),
        market: safeText(holding.market, "Manual"),
        units: Math.max(0, finiteNumber(holding.units)),
        avgEntryPrice: Math.max(0, finiteNumber(holding.avgEntryPrice)),
        referencePrice: Math.max(0, finiteNumber(holding.referencePrice)),
        note: safeText(holding.note, "")
    };
}

function findSelectedStock() {
    return DEMO_STOCKS.find(stock => stock.symbol === selectedStockSymbol) || null;
}

function fillPlanFromStock(stock) {
    document.getElementById("stock-plan-symbol").value = stock.symbol;
    document.getElementById("stock-plan-name").value = stock.name;
    document.getElementById("stock-plan-market").value = stock.market;
    document.getElementById("stock-plan-price").value = stock.referencePrice;
    document.getElementById("stock-plan-state").value = stock.state;
    document.getElementById("stock-plan-thesis").value = stock.reason;
    document.getElementById("stock-plan-invalidation").value = stock.invalidation;
    document.getElementById("stock-plan-broker-note").value = "External broker placeholder only. Confirm manually.";
}

function renderModeDisplay() {
    const isDemo = isPublicDemoMode();
    document.body.classList.toggle("public-demo-mode", isDemo);
    document.body.classList.toggle("private-local-mode", !isDemo);
    document.body.classList.toggle("values-hidden", hideValues);
    document.querySelectorAll("[data-portal-mode-label]").forEach(el => {
        el.textContent = isDemo ? "Public Demo" : "Private Local";
    });
    document.querySelectorAll("[data-demo-message]").forEach(el => {
        el.hidden = !isDemo;
    });
}

function initModeControls() {
    const topbar = document.querySelector(".topbar");
    if (!topbar || document.getElementById("portal-mode-select")) return;
    const mode = document.createElement("label");
    mode.className = "privacy-toggle";
    mode.innerHTML = `
        <span>Mode: <strong data-portal-mode-label>${isPublicDemoMode() ? "Public Demo" : "Private Local"}</strong></span>
        <select id="portal-mode-select" aria-label="Portal privacy mode">
            <option value="${PUBLIC_DEMO_MODE}" ${isPublicDemoMode() ? "selected" : ""}>Public Demo Mode</option>
            <option value="${PRIVATE_LOCAL_MODE}" ${!isPublicDemoMode() ? "selected" : ""}>Private Local Mode</option>
        </select>
    `;
    const privacy = document.createElement("label");
    privacy.className = "privacy-toggle";
    privacy.innerHTML = `
        <input id="hide-values-toggle" type="checkbox" ${hideValues ? "checked" : ""}>
        <span>Hide Values</span>
    `;
    topbar.append(mode, privacy);
    const status = document.createElement("div");
    status.className = "privacy-status-line";
    status.innerHTML = `
        <span><strong data-portal-mode-label>${isPublicDemoMode() ? "Public Demo" : "Private Local"}</strong>: ${STOCK_PUBLIC_WARNING}</span>
        <span data-demo-message>Demo stock data - not real trading data.</span>
    `;
    topbar.insertAdjacentElement("afterend", status);
    mode.querySelector("select").addEventListener("change", event => {
        savePortalMode(event.currentTarget.value);
        reloadStockData();
        renderAll();
    });
    privacy.querySelector("input").addEventListener("change", event => {
        savePrivacyMode(event.currentTarget.checked);
        renderAll();
    });
    renderModeDisplay();
}

function initMasterRuleFooter() {
    if (document.querySelector(".master-rule-footer")) return;
    const footer = document.createElement("footer");
    footer.className = "master-rule-footer";
    footer.innerHTML = `<strong>${MASTER_STOCK_RULE}</strong><span>ZenCloud decides. External broker executes. ZenCloud records and reviews.</span><span>${STOCK_PUBLIC_WARNING}</span>`;
    document.body.appendChild(footer);
}

function renderOpportunityQueue() {
    const body = document.getElementById("stock-opportunities-body");
    if (!body) return;
    body.innerHTML = DEMO_STOCKS.map(stock => `
        <tr>
            <td><strong>${escapeHtml(stock.symbol)}</strong><br><span class="muted">${escapeHtml(stock.name)}</span></td>
            <td>${escapeHtml(stock.market)}</td>
            <td><span class="badge wait">${escapeHtml(stock.state)}</span></td>
            <td class="num">${stock.score}</td>
            <td class="num">${formatMoney(stock.referencePrice)}</td>
            <td>${escapeHtml(stock.reason)}</td>
            <td><button class="table-action" type="button" data-analyse-stock="${escapeHtml(stock.symbol)}">Analyse</button></td>
        </tr>
    `).join("");
    document.querySelectorAll("[data-analyse-stock]").forEach(button => {
        button.addEventListener("click", event => {
            selectedStockSymbol = event.currentTarget.dataset.analyseStock;
            completedBrokerChecks = new Set();
            const stock = findSelectedStock();
            if (stock) fillPlanFromStock(stock);
            renderAnalysis();
            renderBrokerReview();
        });
    });
}

function renderAnalysis() {
    const panel = document.getElementById("stock-analysis-panel");
    if (!panel) return;
    const stock = findSelectedStock();
    if (!stock) {
        panel.innerHTML = `<div class="empty-analysis">Select a stock from the queue. Broker review stays locked until ZenCloud records the plan.</div>`;
        return;
    }
    panel.innerHTML = `
        <div class="stock-analysis-card">
            <div>
                <span class="eyebrow">Selected Stock</span>
                <h3>${escapeHtml(stock.symbol)} / ${escapeHtml(stock.name)}</h3>
                <p>${escapeHtml(stock.reason)}</p>
            </div>
            <div class="rules-grid stock-rules-grid">
                <div class="rule-card watch">State<span>${escapeHtml(stock.state)}</span></div>
                <div class="rule-card volume">Score<span>${stock.score}</span></div>
                <div class="rule-card">Market<span>${escapeHtml(stock.market)}</span></div>
                <div class="rule-card risk">Invalidation<span>${escapeHtml(stock.invalidation)}</span></div>
            </div>
            <div class="handoff-checklist">
                <div class="mini-title">Broker Review Checklist <span class="checklist-progress">${completedBrokerChecks.size} / ${brokerChecklistItems.length} checks</span></div>
                <div class="checklist">
                    ${brokerChecklistItems.map(item => `
                        <label class="check-row">
                            <input type="checkbox" data-broker-check="${escapeHtml(item)}" ${completedBrokerChecks.has(item) ? "checked" : ""}>
                            <span>${escapeHtml(item)}</span>
                        </label>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
    document.querySelectorAll("[data-broker-check]").forEach(input => {
        input.addEventListener("change", event => {
            const item = event.currentTarget.dataset.brokerCheck;
            if (event.currentTarget.checked) completedBrokerChecks.add(item);
            else completedBrokerChecks.delete(item);
            renderAnalysis();
            renderBrokerReview();
        });
    });
}

function planExistsForSelectedStock() {
    return Boolean(selectedStockSymbol && stockJournal.some(plan => normalizePlan(plan).symbol === selectedStockSymbol));
}

function renderBrokerReview() {
    const panel = document.getElementById("stock-broker-review");
    if (!panel) return;
    const stock = findSelectedStock();
    if (!stock) {
        panel.innerHTML = `<p class="compact-empty">Select a stock and complete the checklist. The broker remains a manual external venue placeholder.</p>`;
        return;
    }
    const checklistComplete = completedBrokerChecks.size === brokerChecklistItems.length;
    const planSaved = planExistsForSelectedStock();
    const ready = checklistComplete && planSaved;
    panel.innerHTML = `
        <div class="broker-review-card">
            <div>
                <span class="eyebrow">Broker Placeholder</span>
                <h3>${escapeHtml(stock.symbol)} manual broker review</h3>
                <p>${escapeHtml(MASTER_STOCK_RULE)}</p>
            </div>
            <div class="rules-grid stock-rules-grid">
                <div class="rule-card ${planSaved ? "strong" : "watch"}">Plan<span>${planSaved ? "Saved in ZenCloud" : "Save plan first"}</span></div>
                <div class="rule-card ${checklistComplete ? "strong" : "watch"}">Checklist<span>${completedBrokerChecks.size} / ${brokerChecklistItems.length}</span></div>
                <div class="rule-card">Venue<span>External broker placeholder</span></div>
                <div class="rule-card risk">Execution<span>${ready ? "Manual review only" : "Locked"}</span></div>
            </div>
            <p class="broker-lock-note">${ready ? "Broker review is eligible for manual external action. ZenCloud does not open or prefill a broker." : "Complete the ZenCloud-origin checklist and save the plan before any manual broker review."}</p>
        </div>
    `;
}

function renderStockJournal() {
    const body = document.getElementById("stock-journal-body");
    if (!body) return;
    const rows = stockJournal.map(normalizePlan);
    body.innerHTML = rows.length ? rows.map(plan => `
        <tr>
            <td>${formatTime(plan.recordedAt)}</td>
            <td><strong>${escapeHtml(plan.symbol)}</strong><br><span class="muted">${escapeHtml(plan.name)} / ${escapeHtml(plan.market)}</span></td>
            <td>${escapeHtml(plan.state)}</td>
            <td class="num">${formatMoney(plan.referencePrice)}</td>
            <td class="num">${plan.allocation ? formatMoney(plan.allocation) : "Not set"}</td>
            <td>${escapeHtml(plan.thesis)}</td>
            <td>${escapeHtml(plan.invalidation)}</td>
            <td>${plan.fromZenCloud ? "ZenCloud" : "Blocked"}</td>
            <td><button class="table-action danger-action" type="button" data-delete-stock-plan="${escapeHtml(plan.id)}">Delete</button></td>
        </tr>
    `).join("") : `<tr><td colspan="9" class="loading-cell">No stock plans recorded.</td></tr>`;
    document.querySelectorAll("[data-delete-stock-plan]").forEach(button => {
        button.addEventListener("click", event => {
            stockJournal = saveCollection(STOCK_JOURNAL_STORAGE_KEY, stockJournal.map(normalizePlan).filter(plan => plan.id !== event.currentTarget.dataset.deleteStockPlan));
            renderAll();
        });
    });
}

function renderStockHoldings() {
    const body = document.getElementById("stock-holdings-body");
    if (!body) return;
    const rows = stockHoldings.map(normalizeHolding);
    body.innerHTML = rows.length ? rows.map(holding => {
        const unrealised = (holding.referencePrice - holding.avgEntryPrice) * holding.units;
        return `
            <tr>
                <td><strong>${escapeHtml(holding.symbol)}</strong><br><span class="muted">${escapeHtml(holding.name)}</span></td>
                <td>${escapeHtml(holding.market)}</td>
                <td class="num">${formatUnits(holding.units)}</td>
                <td class="num">${formatMoney(holding.avgEntryPrice)}</td>
                <td class="num">${formatMoney(holding.referencePrice)}</td>
                <td class="num ${unrealised > 0 ? "positive" : unrealised < 0 ? "negative" : "neutral"}">${formatSignedMoney(unrealised)}</td>
                <td>${escapeHtml(holding.note)}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="7" class="loading-cell">No stock holdings recorded.</td></tr>`;
}

function initPlanForm() {
    const form = document.getElementById("stock-plan-form");
    if (!form) return;
    form.addEventListener("submit", event => {
        event.preventDefault();
        const data = new FormData(form);
        const plan = normalizePlan({
            symbol: data.get("symbol"),
            name: data.get("name"),
            market: data.get("market"),
            referencePrice: data.get("referencePrice"),
            allocation: data.get("allocation"),
            state: data.get("state"),
            thesis: data.get("thesis"),
            invalidation: data.get("invalidation"),
            brokerNote: data.get("brokerNote"),
            fromZenCloud: true,
            recordedAt: new Date().toISOString()
        });
        stockJournal = saveCollection(STOCK_JOURNAL_STORAGE_KEY, [plan, ...stockJournal.map(normalizePlan).filter(row => row.symbol !== plan.symbol)]);
        selectedStockSymbol = plan.symbol;
        document.getElementById("stock-plan-message").textContent = isPublicDemoMode()
            ? "Demo Mode: plan shown in this page only. Switch to Private Local Mode to save browser-local stock data."
            : "Stock plan saved locally.";
        renderAll();
    });
    document.getElementById("stock-plan-clear")?.addEventListener("click", () => {
        form.reset();
        document.getElementById("stock-plan-message").textContent = "";
    });
}

function initTabs() {
    document.querySelectorAll("[data-stock-tab-target]").forEach(button => {
        button.addEventListener("click", event => {
            const targetId = event.currentTarget.dataset.stockTabTarget;
            document.querySelectorAll("[data-stock-tab-target]").forEach(tab => tab.classList.toggle("active", tab === event.currentTarget));
            document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === targetId));
        });
    });
}

function renderAll() {
    renderModeDisplay();
    renderOpportunityQueue();
    renderAnalysis();
    renderStockJournal();
    renderStockHoldings();
    renderBrokerReview();
}

initModeControls();
initMasterRuleFooter();
initPlanForm();
initTabs();
renderAll();
