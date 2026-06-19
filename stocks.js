const PORTAL_MODE_STORAGE_KEY = "sixquant.portalMode.v1";
const PRIVACY_STORAGE_KEY = "sixquant.hideValues.v1";
const PUBLIC_DEMO_MODE = "demo";
const PRIVATE_LOCAL_MODE = "private";
const STOCK_JOURNAL_STORAGE_KEY = "sixquant.stocks.tradeJournal.v1";
const STOCK_HOLDINGS_STORAGE_KEY = "sixquant.stocks.holdings.v1";
const STOCK_ASSET_CLASS = "stock";
const MASTER_STOCK_RULE = "If the idea did not start in SixQuant, do not proceed to broker handoff.";
const STOCK_PUBLIC_WARNING = "Public Demo Mode uses demo-only stock data. Private Local Mode stores stock records only in this browser.";

const DEMO_STOCKS = [
    { symbol: "BHP", name: "BHP Group", market: "ASX", sector: "Materials", signalState: "Breakout", riskState: "Controlled", price: 43.2, oneDayChange: 1.4, fiveDayChange: 4.8, relativeVolume: 1.7, marketRegime: "Constructive", reason: "Demo resources setup with price strength and elevated participation", invalidation: "Review if price loses the recorded support level" },
    { symbol: "CBA", name: "Commonwealth Bank", market: "ASX", sector: "Financials", signalState: "Watch", riskState: "Normal", price: 128.4, oneDayChange: 0.6, fiveDayChange: 2.1, relativeVolume: 1.2, marketRegime: "Constructive", reason: "Demo bank watch candidate with steady relative strength", invalidation: "Review if sector breadth weakens" },
    { symbol: "CSL", name: "CSL", market: "ASX", sector: "Healthcare", signalState: "Sell Risk", riskState: "Elevated", price: 284.1, oneDayChange: -1.1, fiveDayChange: -3.6, relativeVolume: 1.4, marketRegime: "Mixed", reason: "Demo healthcare risk review after downside pressure", invalidation: "Review if thesis no longer matches price action" },
    { symbol: "WES", name: "Wesfarmers", market: "ASX", sector: "Consumer Staples", signalState: "Watch", riskState: "Normal", price: 69.8, oneDayChange: 0.2, fiveDayChange: 1.3, relativeVolume: 0.9, marketRegime: "Mixed", reason: "Demo defensive watchlist candidate", invalidation: "Review if market context changes" },
    { symbol: "MQG", name: "Macquarie Group", market: "ASX", sector: "Financials", signalState: "Volume Spike", riskState: "Review", price: 198.7, oneDayChange: 2.2, fiveDayChange: -0.4, relativeVolume: 2.1, marketRegime: "Mixed", reason: "Demo volume event requiring manual review", invalidation: "Review if volume event fades without follow-through" },
    { symbol: "TLS", name: "Telstra Group", market: "ASX", sector: "Communication Services", signalState: "No Action", riskState: "Low", price: 4.08, oneDayChange: -0.1, fiveDayChange: 0.2, relativeVolume: 0.7, marketRegime: "Mixed", reason: "Demo low-priority candidate with limited movement", invalidation: "No active setup" }
];

const DEMO_STOCK_JOURNAL = [
    {
        id: "STOCK-DEMO-1",
        assetClass: STOCK_ASSET_CLASS,
        symbol: "BHP",
        name: "BHP Group",
        market: "ASX",
        state: "Watch",
        referencePrice: 43.2,
        positionSize: 1500,
        whyNow: "Demo stock plan - workflow preview only",
        entryTrigger: "Demo trigger: review only",
        invalidation: "Demo invalidation level",
        reviewTarget: "Demo review target",
        holdingWindow: "2-10 trading days",
        notes: "Demo stock plan - not real trading data",
        accountValue: 50000,
        riskPercent: 1,
        invalidationPrice: 41.5,
        fromSixQuant: true,
        recordedAt: "2026-05-12T09:30:00+10:00"
    }
];

const DEMO_STOCK_HOLDINGS = [
    { assetClass: STOCK_ASSET_CLASS, symbol: "BHP", name: "Demo BHP", market: "ASX", units: 20, avgEntryPrice: 41.5, referencePrice: 43.2, note: "Demo stock position - not real trading data" },
    { assetClass: STOCK_ASSET_CLASS, symbol: "CBA", name: "Demo CBA", market: "ASX", units: 6, avgEntryPrice: 124.0, referencePrice: 128.4, note: "Demo stock position - not real trading data" }
];

const brokerChecklistItems = [
    "Idea started in SixQuant Stocks Workspace",
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
let snapshotData = null;
let snapshotSource = "demo";
let activeRegionFilter = "All";

function storageAvailable() {
    try {
        const key = "__sixquant_stock_storage_test__";
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

function formatTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    return date.toLocaleString("en-AU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Mirrors app.js loadRiskRules — stocks.html does not load app.js.
function loadRiskRules() {
    const defaults = { maxPositionPct: 8, cashReservePct: 20, exitAlertPct: 8 };
    if (!storageAvailable()) return defaults;
    try {
        const stored = JSON.parse(window.localStorage.getItem("sixquant.riskRules.v1") || "{}");
        return {
            maxPositionPct: Math.max(0.5, finiteNumber(stored.maxPositionPct, defaults.maxPositionPct)),
            cashReservePct: Math.max(0, finiteNumber(stored.cashReservePct, defaults.cashReservePct)),
            exitAlertPct: Math.max(0.5, finiteNumber(stored.exitAlertPct, defaults.exitAlertPct))
        };
    } catch {
        return defaults;
    }
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
    const referencePrice = Math.max(0, finiteNumber(plan.referencePrice ?? plan.entryPrice));
    const positionSize = Math.max(0, finiteNumber(plan.positionSize ?? plan.allocation));
    const accountValue = Math.max(0, finiteNumber(plan.accountValue));
    const riskPercent = Math.max(0, finiteNumber(plan.riskPercent));
    const invalidationPrice = Math.max(0, finiteNumber(plan.invalidationPrice));
    return {
        id: safeText(plan.id, stockId()),
        assetClass: STOCK_ASSET_CLASS,
        symbol,
        name: safeText(plan.name, symbol || "Unknown Stock"),
        market: safeText(plan.market, "Manual"),
        state: safeText(plan.state, "Watch"),
        referencePrice,
        positionSize,
        allocation: positionSize,
        whyNow: safeText(plan.whyNow ?? plan.thesis, "Manual SixQuant reason required"),
        thesis: safeText(plan.whyNow ?? plan.thesis, "Manual SixQuant reason required"),
        entryTrigger: safeText(plan.entryTrigger, "Manual trigger required"),
        invalidation: safeText(plan.invalidation, "Manual invalidation required"),
        reviewTarget: safeText(plan.reviewTarget, "Manual review target required"),
        holdingWindow: safeText(plan.holdingWindow, "Manual holding window required"),
        notes: safeText(plan.notes ?? plan.brokerNote, ""),
        accountValue,
        riskPercent,
        invalidationPrice,
        // Preserve Release-2 fee/net economics. initPlanForm re-normalises every
        // other plan on each save; without carrying these through, saving one plan
        // would strip the persisted fee calculations off all the others.
        targetPrice: Math.max(0, finiteNumber(plan.targetPrice)),
        brokerageFee: finiteNumber(plan.brokerageFee),
        feePercent: finiteNumber(plan.feePercent),
        spreadPercent: finiteNumber(plan.spreadPercent),
        grossProfit: finiteNumber(plan.grossProfit),
        netProfit: finiteNumber(plan.netProfit),
        totalCosts: finiteNumber(plan.totalCosts),
        grossReturnPct: finiteNumber(plan.grossReturnPct),
        netReturnPct: finiteNumber(plan.netReturnPct),
        breakevenPrice: finiteNumber(plan.breakevenPrice),
        feeModelVersion: plan.feeModelVersion,
        fromSixQuant: plan.fromSixQuant !== false,
        recordedAt: safeText(plan.recordedAt, new Date().toISOString())
    };
}

function normalizeHolding(holding = {}) {
    const symbol = safeText(holding.symbol).toUpperCase();
    return {
        symbol,
        assetClass: STOCK_ASSET_CLASS,
        name: safeText(holding.name, symbol || "Unknown Stock"),
        market: safeText(holding.market, "Manual"),
        units: Math.max(0, finiteNumber(holding.units)),
        avgEntryPrice: Math.max(0, finiteNumber(holding.avgEntryPrice)),
        referencePrice: Math.max(0, finiteNumber(holding.referencePrice)),
        note: safeText(holding.note, "")
    };
}

const SNAPSHOT_REGIONS = ["All", "Australia", "U.S. Tech", "U.S. Large Cap", "Global ADRs"];

function normalizeSnapshotAsset(asset) {
    const symbol = safeText(asset.symbol);
    return {
        symbol,
        name: safeText(asset.name, symbol || "Unknown"),
        market: safeText(asset.exchange, "N/A"),
        sector: safeText(asset.sector, "Unknown"),
        signalState: safeText(asset.signalState, "No Action"),
        riskState: safeText(asset.riskState, "Normal"),
        price: finiteNumber(asset.price),
        oneDayChange: finiteNumber(asset.change1d),
        fiveDayChange: finiteNumber(asset.change5d),
        relativeVolume: finiteNumber(asset.relativeVolume, 1),
        marketRegime: safeText(asset.marketRegime, "Mixed"),
        region: safeText(asset.region, "Unknown"),
        currency: safeText(asset.currency, "USD"),
        reason: "Derived from Stooq snapshot — review only. Not a buy/sell recommendation.",
        invalidation: "Review if price action or sector context changes materially.",
        source: "snapshot"
    };
}

function allLiveStocks() {
    if (snapshotSource === "snapshot" && snapshotData && Array.isArray(snapshotData.assets) && snapshotData.assets.length > 0) {
        return snapshotData.assets.map(normalizeSnapshotAsset);
    }
    return DEMO_STOCKS.map(s => ({ ...s, source: "demo" }));
}

function currentStocks() {
    const stocks = allLiveStocks();
    if (snapshotSource !== "snapshot" || activeRegionFilter === "All") return stocks;
    return stocks.filter(s => s.region === activeRegionFilter);
}

function isSnapshotStale(lastUpdated) {
    if (!lastUpdated) return false;
    const updated = new Date(lastUpdated);
    return !Number.isNaN(updated.getTime()) && (Date.now() - updated.getTime()) > 24 * 60 * 60 * 1000;
}

async function loadSnapshotData() {
    try {
        const resp = await fetch("data/stocks-snapshot.json", { cache: "no-cache" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data && Array.isArray(data.assets) && data.assets.length > 0) {
            if (!snapshotData || snapshotSource !== "snapshot") {
                snapshotData = data;
                snapshotSource = "snapshot";
            }
        } else {
            if (!snapshotData) snapshotSource = "demo";
        }
    } catch (_e) {
        if (!snapshotData) snapshotSource = "demo";
    }
    renderAll();
}

function findSelectedStock() {
    return allLiveStocks().find(stock => stock.symbol === selectedStockSymbol) || null;
}

function fillPlanFromStock(stock) {
    document.getElementById("stock-plan-symbol").value = stock.symbol;
    document.getElementById("stock-plan-name").value = stock.name;
    document.getElementById("stock-plan-market").value = stock.market;
    document.getElementById("stock-plan-state").value = stock.signalState;
    document.getElementById("stock-plan-why-now").value = stock.reason;
    document.getElementById("stock-plan-entry-trigger").value = stock.signalState === "No Action" ? "No active trigger" : "Manual confirmation of setup";
    document.getElementById("stock-plan-invalidation").value = stock.invalidation;
    document.getElementById("stock-plan-review-target").value = stock.signalState === "Sell Risk" ? "Review position risk" : "Review after next market update";
    document.getElementById("stock-plan-holding-window").value = stock.signalState === "Breakout" ? "2-10 trading days" : "Watchlist review";
    document.getElementById("stock-plan-position-size").value = "";
    document.getElementById("stock-plan-notes").value = "Broker execution not connected.";
    document.getElementById("stock-risk-entry").value = stock.price;
    document.getElementById("stock-risk-invalidation-price").value = Math.max(0, stock.price * 0.95).toFixed(2);
    renderRiskPanel();
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
    updateSensitiveInputMasking();
}

function updateSensitiveInputMasking() {
    [
        "stock-plan-position-size",
        "stock-risk-account",
        "stock-risk-entry",
        "stock-risk-invalidation-price"
    ].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.type = hideValues ? "password" : "number";
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
    footer.innerHTML = `<strong>${MASTER_STOCK_RULE}</strong><span>SixQuant decides. Broker handoff is a placeholder. SixQuant records and reviews.</span><span>${STOCK_PUBLIC_WARNING}</span>`;
    document.body.appendChild(footer);
}

function stockRankingScore(stock) {
    const movementScore = (finiteNumber(stock.oneDayChange) * 5) + (finiteNumber(stock.fiveDayChange) * 3);
    const volumeScore = Math.max(0, finiteNumber(stock.relativeVolume) - 1) * 18;
    const sectorScore = {
        Materials: 8,
        Financials: 6,
        Healthcare: 4,
        "Consumer Staples": 3,
        "Communication Services": 2
    }[stock.sector] || 3;
    const regimeScore = stock.marketRegime === "Constructive" ? 8 : stock.marketRegime === "Mixed" ? 3 : 0;
    const riskScore = {
        Low: 6,
        Normal: 5,
        Controlled: 5,
        Review: 1,
        Elevated: -8
    }[stock.riskState] || 0;
    const signalScore = {
        Breakout: 12,
        "Volume Spike": 8,
        Watch: 5,
        "No Action": 0,
        "Sell Risk": -10
    }[stock.signalState] || 0;
    return movementScore + volumeScore + sectorScore + regimeScore + riskScore + signalScore;
}

function rankedStocks() {
    return currentStocks()
        .map(stock => ({ ...stock, rankingScore: stockRankingScore(stock) }))
        .sort((a, b) => b.rankingScore - a.rankingScore);
}

function stockActionFor(stock) {
    if (stock.signalState === "Breakout" || stock.signalState === "Volume Spike") return "Analyse";
    if (stock.signalState === "Watch") return "Review";
    return "Watch only";
}

function signalBadgeClass(signalState) {
    return {
        Breakout: "strong",
        Watch: "watch",
        "Sell Risk": "risk",
        "Volume Spike": "volume",
        "No Action": "wait"
    }[signalState] || "wait";
}

function formatSignedChange(value) {
    const numeric = finiteNumber(value);
    const prefix = numeric > 0 ? "+" : "";
    return `${prefix}${numeric.toFixed(1)}%`;
}

function positionForStock(stock) {
    return stockHoldings.map(normalizeHolding).find(holding => holding.symbol === stock.symbol) || null;
}

function agentOutput(label, output, detail) {
    return { label, output, detail };
}

function stockAgentConsensus(stock) {
    const oneDay = finiteNumber(stock.oneDayChange);
    const fiveDay = finiteNumber(stock.fiveDayChange);
    const relativeVolume = finiteNumber(stock.relativeVolume);
    const position = positionForStock(stock);
    const excessiveMove = Math.abs(oneDay) >= 4 || Math.abs(fiveDay) >= 9;
    const largeReversal = Math.sign(oneDay) !== Math.sign(fiveDay) && Math.abs(oneDay) >= 1.5 && Math.abs(fiveDay) >= 2;

    const agents = [
        agentOutput(
            "Momentum Agent",
            oneDay > 0 && fiveDay > 0 ? "Support" : oneDay < 0 && fiveDay < 0 ? "Reject" : "Watch",
            `1D ${formatSignedChange(oneDay)} / 5D ${formatSignedChange(fiveDay)}`
        ),
        agentOutput(
            "Volume Agent",
            relativeVolume >= 1.5 ? "Support" : relativeVolume >= 0.9 ? "Watch" : "Insufficient Data",
            `Relative volume ${relativeVolume.toFixed(1)}x`
        ),
        agentOutput(
            "Risk Agent",
            stock.signalState === "Sell Risk" || stock.riskState === "Elevated" || largeReversal || excessiveMove ? "Reject" : stock.riskState === "Review" ? "Watch" : "Support",
            `${stock.riskState}; reversal ${largeReversal ? "yes" : "no"}; excessive move ${excessiveMove ? "yes" : "no"}`
        ),
        agentOutput(
            "Market Agent",
            stock.marketRegime === "Constructive" ? "Support" : stock.marketRegime === "Mixed" ? "Watch" : "Reject",
            `${stock.marketRegime} regime / ${stock.sector} sector`
        ),
        agentOutput(
            "Portfolio Agent",
            position ? (stock.signalState === "Sell Risk" || stock.riskState === "Elevated" ? "Reject" : "Watch") : "Insufficient Data",
            position ? `Held position: ${formatUnits(position.units)} ${stock.symbol}` : "No local stock position recorded"
        )
    ];

    const support = agents.filter(agent => agent.output === "Support").length;
    const reject = agents.filter(agent => agent.output === "Reject").length;
    const watch = agents.filter(agent => agent.output === "Watch").length;
    let consensus = "No Action";
    if (position && (stock.signalState === "Sell Risk" || stock.riskState === "Elevated")) consensus = "Review Position";
    else if (reject >= 2 || stock.signalState === "No Action") consensus = "No Action";
    else if (support >= 3 && reject === 0) consensus = "High Consensus";
    else if (support >= 2 && reject <= 1) consensus = "Analyse Candidate";
    else if (watch >= 2 || support >= 1) consensus = "Watch Only";

    return { agents, consensus, support, reject, watch };
}

function consensusBadgeClass(consensus) {
    return {
        "High Consensus": "strong",
        "Analyse Candidate": "volume",
        "Watch Only": "watch",
        "No Action": "wait",
        "Review Position": "risk"
    }[consensus] || "wait";
}

function agentOutputClass(output) {
    return {
        Support: "strong",
        Watch: "watch",
        Reject: "risk",
        "Insufficient Data": "wait"
    }[output] || "wait";
}

function renderOpportunityQueue() {
    const body = document.getElementById("stock-opportunities-body");
    if (!body) return;
    const stocks = rankedStocks();
    const bestSetup = stocks[0];
    const bestSetupEl = document.getElementById("stock-best-setup");
    if (bestSetupEl) bestSetupEl.textContent = bestSetup ? `${bestSetup.symbol} / ${bestSetup.signalState}` : "No setup";
    body.innerHTML = stocks.map((stock, index) => {
        const action = stockActionFor(stock);
        return `
        <tr>
            <td class="num">${index + 1}</td>
            <td><strong>${escapeHtml(stock.symbol)}</strong><br><span class="muted">${escapeHtml(stock.market)}</span></td>
            <td>${escapeHtml(stock.name)}</td>
            <td>${escapeHtml(stock.sector)}</td>
            <td class="num">${formatMoney(stock.price)}</td>
            <td class="num ${stock.oneDayChange > 0 ? "positive" : stock.oneDayChange < 0 ? "negative" : "neutral"}">${formatSignedChange(stock.oneDayChange)}</td>
            <td class="num ${stock.fiveDayChange > 0 ? "positive" : stock.fiveDayChange < 0 ? "negative" : "neutral"}">${formatSignedChange(stock.fiveDayChange)}</td>
            <td class="num">${finiteNumber(stock.relativeVolume).toFixed(1)}x</td>
            <td><span class="badge ${signalBadgeClass(stock.signalState)}">${escapeHtml(stock.signalState)}</span></td>
            <td>${escapeHtml(stock.riskState)}</td>
            <td>${action === "Analyse"
                ? `<button class="table-action" type="button" data-analyse-stock="${escapeHtml(stock.symbol)}">Analyse</button>`
                : `<button class="table-action" type="button" data-analyse-stock="${escapeHtml(stock.symbol)}">${escapeHtml(action)}</button>`}</td>
        </tr>
    `;
    }).join("");
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
        panel.innerHTML = `<div class="empty-analysis">Select a ticker from the queue. Broker review stays locked until SixQuant records the plan.</div>`;
        return;
    }
    const consensus = stockAgentConsensus(stock);
    panel.innerHTML = `
        <div class="stock-analysis-card">
            <div>
                <span class="eyebrow">Selected Ticker</span>
                <h3>${escapeHtml(stock.symbol)} / ${escapeHtml(stock.name)}</h3>
                <p>${escapeHtml(stock.reason)}</p>
            </div>
            <div class="rules-grid stock-rules-grid">
                <div class="rule-card">Ticker<span>${escapeHtml(stock.symbol)}</span></div>
                <div class="rule-card">Company<span>${escapeHtml(stock.name)}</span></div>
                <div class="rule-card">Sector<span>${escapeHtml(stock.sector)}</span></div>
                <div class="rule-card">Price<span>${formatMoney(stock.price)}</span></div>
                <div class="rule-card ${stock.oneDayChange > 0 ? "strong" : stock.oneDayChange < 0 ? "risk" : "watch"}">1D Change<span>${formatSignedChange(stock.oneDayChange)}</span></div>
                <div class="rule-card ${stock.fiveDayChange > 0 ? "strong" : stock.fiveDayChange < 0 ? "risk" : "watch"}">5D Change<span>${formatSignedChange(stock.fiveDayChange)}</span></div>
                <div class="rule-card volume">Relative Volume<span>${finiteNumber(stock.relativeVolume).toFixed(1)}x</span></div>
                <div class="rule-card ${signalBadgeClass(stock.signalState)}">Signal State<span>${escapeHtml(stock.signalState)}</span></div>
                <div class="rule-card risk">Risk State<span>${escapeHtml(stock.riskState)}</span></div>
                <div class="rule-card">Market Regime<span>${escapeHtml(stock.marketRegime)}</span></div>
                <div class="rule-card risk">Invalidation<span>${escapeHtml(stock.invalidation)}</span></div>
            </div>
            <div class="agent-consensus stock-agent-consensus">
                <div class="mini-title">Stock Agent Consensus <span class="badge ${consensusBadgeClass(consensus.consensus)}">${escapeHtml(consensus.consensus)}</span></div>
                <div class="consensus-grid">
                    ${consensus.agents.map(agent => `
                        <span>
                            <small>${escapeHtml(agent.label)}</small>
                            <strong class="${agentOutputClass(agent.output)}">${escapeHtml(agent.output)}</strong>
                            <em>${escapeHtml(agent.detail)}</em>
                        </span>
                    `).join("")}
                </div>
                <p class="helper-output">Consensus is deterministic and review-only. It does not unlock broker action.</p>
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

function stockPlanForSelectedStock() {
    return selectedStockSymbol ? stockJournal.map(normalizePlan).find(plan => plan.symbol === selectedStockSymbol) || null : null;
}

function riskPanelValues() {
    const accountValue = Math.max(0, finiteNumber(document.getElementById("stock-risk-account")?.value));
    const riskPercent = Math.max(0, finiteNumber(document.getElementById("stock-risk-percent")?.value));
    const entryPrice = Math.max(0, finiteNumber(document.getElementById("stock-risk-entry")?.value));
    const invalidationPrice = Math.max(0, finiteNumber(document.getElementById("stock-risk-invalidation-price")?.value));
    const maxLossAmount = accountValue * (riskPercent / 100);
    const perShareRisk = Math.max(0, entryPrice - invalidationPrice);
    const estimatedShares = perShareRisk > 0 ? Math.floor(maxLossAmount / perShareRisk) : 0;
    const suggestedPositionSize = estimatedShares * entryPrice;
    const allocationAfterTrade = accountValue > 0 ? (suggestedPositionSize / accountValue) * 100 : 0;
    return { accountValue, riskPercent, entryPrice, invalidationPrice, maxLossAmount, suggestedPositionSize, estimatedShares, allocationAfterTrade };
}

function renderRiskPanel() {
    const output = document.getElementById("stock-risk-output");
    if (!output) return;
    const risk = riskPanelValues();
    if (!risk.accountValue || !risk.entryPrice || !risk.invalidationPrice || risk.invalidationPrice >= risk.entryPrice) {
        output.textContent = "Enter account, risk, entry, and an invalidation price below entry.";
        return;
    }
    output.innerHTML = `
        <span>Max loss amount <strong>${formatMoney(risk.maxLossAmount)}</strong></span>
        <span>Suggested position size <strong>${formatMoney(risk.suggestedPositionSize)}</strong></span>
        <span>Estimated shares <strong>${formatUnits(risk.estimatedShares)}</strong></span>
        <span>Allocation after trade <strong>${risk.allocationAfterTrade.toFixed(1)}%</strong></span>
    `;
}

function renderBrokerReview() {
    const panel = document.getElementById("stock-broker-review");
    if (!panel) return;
    const stock = findSelectedStock();
    if (!stock) {
        panel.innerHTML = `<p class="compact-empty">Broker execution not connected.</p>`;
        return;
    }
    const checklistComplete = completedBrokerChecks.size === brokerChecklistItems.length;
    const savedPlan = stockPlanForSelectedStock();
    const planSaved = Boolean(savedPlan);
    const ready = checklistComplete && planSaved;
    panel.innerHTML = `
        <div class="broker-review-card">
            <div>
                <span class="eyebrow">Broker handoff</span>
                <h3>${escapeHtml(stock.symbol)} broker handoff</h3>
                <p>${escapeHtml(MASTER_STOCK_RULE)}</p>
            </div>
            <div class="rules-grid stock-rules-grid">
                <div class="rule-card ${planSaved ? "strong" : "watch"}">Plan<span>${planSaved ? "Saved in SixQuant" : "Save plan first"}</span></div>
                <div class="rule-card ${checklistComplete ? "strong" : "watch"}">Checklist<span>${completedBrokerChecks.size} / ${brokerChecklistItems.length}</span></div>
                <div class="rule-card">Broker handoff<span>Broker execution not connected.</span></div>
                <div class="rule-card risk">Status<span>${ready ? "Placeholder only" : "Locked"}</span></div>
            </div>
            ${savedPlan ? `<p class="broker-lock-note">Saved plan: ${escapeHtml(savedPlan.symbol)} / ${escapeHtml(savedPlan.state)} / ${escapeHtml(savedPlan.entryTrigger)}. Broker execution not connected.</p>` : ""}
            <p class="broker-lock-note">Broker execution not connected. SixQuant does not open, prefill, or link to a broker.</p>
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
            <td class="num">${plan.positionSize ? formatMoney(plan.positionSize) : "Not set"}</td>
            <td>—</td>
            <td>${escapeHtml(plan.whyNow)}</td>
            <td>${escapeHtml(plan.entryTrigger)}</td>
            <td>${escapeHtml(plan.invalidation)}</td>
            <td>Broker execution not connected.</td>
            <td><button class="table-action danger-action" type="button" data-delete-stock-plan="${escapeHtml(plan.id)}">Delete</button></td>
        </tr>
    `).join("") : `<tr><td colspan="11" class="loading-cell">No stock plans recorded.</td></tr>`;
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
    }).join("") : `<tr><td colspan="7" class="loading-cell">No stock positions recorded.</td></tr>`;
}

function initPlanForm() {
    const form = document.getElementById("stock-plan-form");
    if (!form) return;
    form.addEventListener("submit", event => {
        event.preventDefault();
        const data = new FormData(form);
        const message = document.getElementById("stock-plan-message");
        const rules = loadRiskRules();
        const size = finiteNumber(data.get("positionSize"));
        const accountValue = finiteNumber(data.get("accountValue"));
        if (!safeText(String(data.get("invalidation") || ""), "")) {
            if (message) message.textContent = "Risk rule: set an invalidation level before recording the plan.";
            return;
        }
        if (size > 0 && accountValue > 0 && size > accountValue * (rules.maxPositionPct / 100)) {
            if (message) message.textContent = `Risk rule: position ${formatMoney(size)} exceeds the ${rules.maxPositionPct}% cap (${formatMoney(accountValue * rules.maxPositionPct / 100)} of account value).`;
            return;
        }
        const plan = normalizePlan({
            symbol: data.get("symbol"),
            name: data.get("name"),
            market: data.get("market"),
            referencePrice: data.get("entryPrice"),
            positionSize: data.get("positionSize"),
            state: data.get("state"),
            whyNow: data.get("whyNow"),
            entryTrigger: data.get("entryTrigger"),
            invalidation: data.get("invalidation"),
            reviewTarget: data.get("reviewTarget"),
            holdingWindow: data.get("holdingWindow"),
            notes: data.get("notes"),
            accountValue: data.get("accountValue"),
            riskPercent: data.get("riskPercent"),
            invalidationPrice: data.get("invalidationPrice"),
            assetClass: STOCK_ASSET_CLASS,
            fromSixQuant: true,
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
        renderRiskPanel();
    });
    ["stock-risk-account", "stock-risk-percent", "stock-risk-entry", "stock-risk-invalidation-price"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", renderRiskPanel);
    });
    renderRiskPanel();
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

function renderSourceBadge() {
    const badge = document.getElementById("stock-source-badge");
    if (!badge) return;
    const subtitle = document.getElementById("stock-queue-subtitle");
    if (snapshotSource === "snapshot" && snapshotData) {
        const mode = snapshotData.displayMode || snapshotData.mode || "snapshot";
        const label = { delayed: "ASX delayed feed", fallback: "ASX stale fallback", offline: "ASX offline", snapshot: "Stooq Snapshot" }[mode] || "Stooq Snapshot";
        badge.textContent = label;
        if (subtitle) {
            const src = snapshotData.source || "snapshot";
            const updated = snapshotData.lastUpdated ? formatTimestamp(snapshotData.lastUpdated) : "Not recorded";
            const errors = Array.isArray(snapshotData.fetchErrors) ? snapshotData.fetchErrors.length : 0;
            subtitle.textContent = (mode === "delayed" || mode === "fallback")
                ? `Source: ${src} | Mode: ${mode} | Updated: ${updated} | Errors: ${errors}`
                : "Ranked from snapshot. Signals are derived — review only. Not buy/sell recommendations.";
        }
    } else {
        badge.textContent = "Demo fallback";
        if (subtitle) subtitle.textContent = "Demo-only ranked review list. No live feed or paid API.";
    }
}

function renderStalenessWarning() {
    const warning = document.getElementById("stock-staleness-warning");
    if (!warning) return;
    const mode = snapshotData?.displayMode;
    if (mode) {
        warning.hidden = (mode === "delayed");
        if (!warning.hidden) {
            warning.innerHTML = `<span><strong>ASX feed mode: ${escapeHtml(mode)}</strong> — ${escapeHtml(mode === "offline" ? "provider feed not populated yet; run GitHub Action before production stock use." : "data may be stale; confirm price in broker before execution.")} Last updated: ${escapeHtml(snapshotData.lastUpdated ? formatTimestamp(snapshotData.lastUpdated) : "not recorded")}.</span>`;
        }
    } else {
        warning.hidden = !(snapshotSource === "snapshot" && snapshotData && isSnapshotStale(snapshotData.lastUpdated));
    }
}

function renderRegionFilters() {
    const container = document.getElementById("stock-region-filters");
    if (!container) return;
    if (snapshotSource !== "snapshot") {
        container.innerHTML = "";
        return;
    }
    container.innerHTML = SNAPSHOT_REGIONS.map(region =>
        `<button class="filter-btn${activeRegionFilter === region ? " active" : ""}" type="button" data-region-filter="${escapeHtml(region)}">${escapeHtml(region)}</button>`
    ).join("");
    container.querySelectorAll("[data-region-filter]").forEach(btn => {
        btn.addEventListener("click", event => {
            activeRegionFilter = event.currentTarget.dataset.regionFilter;
            selectedStockSymbol = "";
            renderAll();
        });
    });
}

function renderAll() {
    renderModeDisplay();
    renderSourceBadge();
    renderStalenessWarning();
    renderRegionFilters();
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
loadSnapshotData();
