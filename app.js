const WATCHLIST_IDS = [
    "cardano",
    "binancecoin",
    "bitcoin",
    "dogecoin",
    "polkadot",
    "ethereum",
    "litecoin",
    "stellar",
    "theta-token"
];

const FALLBACK_MARKETS = [
    { id: "bitcoin", name: "Bitcoin", symbol: "btc", current_price: 110537.56, market_cap: 2200000000000, total_volume: 38100000000, price_change_percentage_24h: -0.08, price_change_percentage_1h_in_currency: 0.16, image: "" },
    { id: "ethereum", name: "Ethereum", symbol: "eth", current_price: 3068.5, market_cap: 363100000000, total_volume: 17100000000, price_change_percentage_24h: -0.41, price_change_percentage_1h_in_currency: 0.11, image: "" },
    { id: "binancecoin", name: "BNB", symbol: "bnb", current_price: 941.81, market_cap: 123700000000, total_volume: 1600000000, price_change_percentage_24h: 1.1, price_change_percentage_1h_in_currency: 0.23, image: "" },
    { id: "dogecoin", name: "Dogecoin", symbol: "doge", current_price: 0.151801, market_cap: 25200000000, total_volume: 1000000000, price_change_percentage_24h: 1.2, price_change_percentage_1h_in_currency: 0.38, image: "" },
    { id: "cardano", name: "Cardano", symbol: "ada", current_price: 0.358968, market_cap: 12800000000, total_volume: 514000000, price_change_percentage_24h: -0.41, price_change_percentage_1h_in_currency: -0.08, image: "" },
    { id: "stellar", name: "Stellar", symbol: "xlm", current_price: 0.208954, market_cap: 6900000000, total_volume: 151100000, price_change_percentage_24h: 1.24, price_change_percentage_1h_in_currency: 0.32, image: "" },
    { id: "litecoin", name: "Litecoin", symbol: "ltc", current_price: 77.95, market_cap: 5900000000, total_volume: 346700000, price_change_percentage_24h: -0.44, price_change_percentage_1h_in_currency: -0.04, image: "" },
    { id: "polkadot", name: "Polkadot", symbol: "dot", current_price: 1.83, market_cap: 3000000000, total_volume: 137400000, price_change_percentage_24h: 1.96, price_change_percentage_1h_in_currency: 0.51, image: "" },
    { id: "theta-token", name: "Theta", symbol: "theta", current_price: 0.294, market_cap: 289600000, total_volume: 13000000, price_change_percentage_24h: 2.12, price_change_percentage_1h_in_currency: 0.62, image: "" }
];

const FALLBACK_SPARKLINE = [12, 12.4, 12.8, 13, 13.4, 14.2, 14.8, 15.1, 15.4];
const FALLBACK_STATUS = "Fallback Snapshot - review/planning only.";
let fallbackWarningShown = false;
let detailedFetchErrorLogged = false;

// Static GitHub Pages build: keep market data keyless in the browser.
// A future GitHub Action or lightweight backend can publish a static JSON
// snapshot for this file to read without exposing provider credentials.
const MARKET_DATA_PROXY_URL = "";
const REFRESH_INTERVAL_MS = 60000;
const PORTAL_MODE_STORAGE_KEY = "zencloud.portalMode.v1";
const PRIVACY_STORAGE_KEY = "zencloud.hideValues.v1";
const PUBLIC_DEMO_MODE = "demo";
const PRIVATE_LOCAL_MODE = "private";
const MASTER_RULE = "If the idea did not start in ZenCloud, do not execute it in CoinSpot.";
const PUBLIC_PRIVACY_WARNING = "Do not enter group trade deals, private signals, real balances, or private strategy notes into the public demo site. Private data is stored only in your browser and should not be committed to GitHub.";
const PUBLIC_SITE_RULE = "Shared GitHub Pages deployment is public. Use Public Demo Mode when sharing the portal.";
const MARKET_PROVIDERS = {
    currentPublicFeed: "Live Public Feed",
    coinMarketCapProxy: "Static Snapshot Ready",
    fallbackSnapshot: "Fallback Snapshot"
};
const dataConfidence = {
    mode: "Live Data",
    provider: MARKET_PROVIDERS.currentPublicFeed,
    plannedProvider: "Static Snapshot Ready",
    lastSuccessfulLiveFetch: "",
    lastAttemptedFetch: "",
    lastStatusUpdate: "",
    failureReason: "None",
    retryCount: 0,
    nextRetryTime: "next refresh",
    isFallback: false,
    dataKind: "Live"
};

const DEMO_HOLDINGS = [
    { symbol: "BTC", name: "Demo BTC", balance: 0.125, avgEntryPrice: 104000, note: "Demo holding - not real trading data", updatedAt: "2026-05-01T09:00:00+10:00" },
    { symbol: "ETH", name: "Demo ETH", balance: 1.8, avgEntryPrice: 2950, note: "Demo holding - not real trading data", updatedAt: "2026-05-03T11:30:00+10:00" },
    { symbol: "FET", name: "Demo FET", balance: 2400, avgEntryPrice: 0.62, note: "Demo holding - not real trading data", updatedAt: "2026-05-05T14:15:00+10:00" }
];

const LEGACY_DEFAULT_HOLDINGS = [
    { symbol: "BTC", note: "Default sample holding" },
    { symbol: "LTC", note: "Default sample holding" },
    { symbol: "ETH", note: "Default sample holding" },
    { symbol: "ETC", note: "Default sample holding" },
    { symbol: "BNB", note: "Default sample holding" },
    { symbol: "TRB", note: "Default sample holding" }
];

const DEMO_TRADE_JOURNAL = [
    {
        id: "DEMO-OPEN-1",
        assetClass: "crypto",
        symbol: "BTC",
        name: "Demo BTC",
        entryDate: "2026-05-10T10:00:00+10:00",
        entryPrice: 104000,
        positionSize: 2500,
        signalState: "Watch",
        agentConsensus: "Demo consensus",
        reasonEntry: "Demo trade plan for workflow preview only",
        plannedInvalidation: "Demo invalidation: review if momentum weakens",
        notes: "Demo trade plan - not real trading data",
        fromZenCloud: true,
        status: "open",
        updatedAt: "2026-05-10T10:00:00+10:00"
    },
    {
        id: "DEMO-CLOSED-1",
        assetClass: "crypto",
        symbol: "ETH",
        name: "Demo ETH",
        entryDate: "2026-04-22T09:30:00+10:00",
        entryPrice: 2800,
        positionSize: 1800,
        exitDate: "2026-04-26T15:10:00+10:00",
        exitPrice: 3050,
        exitReason: "Demo closed trade review",
        resultAud: 160.71,
        resultPercent: 8.93,
        signalState: "Breakout",
        agentConsensus: "Demo consensus",
        reasonEntry: "Demo closed trade - workflow example only",
        plannedInvalidation: "Demo invalidation level",
        notes: "Demo report data - not real trading data",
        ruleFollowed: true,
        fromZenCloud: true,
        mistakeType: "Other",
        lessonLearned: "Demo lesson only",
        status: "closed",
        updatedAt: "2026-04-26T15:10:00+10:00"
    }
];

const DEMO_STOCK_TRADE_JOURNAL = [
    {
        id: "STOCK-DEMO-1",
        assetClass: "stock",
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

const DEMO_STOCK_POSITIONS = [
    { assetClass: "stock", symbol: "BHP", name: "Demo BHP", market: "ASX", units: 20, avgEntryPrice: 41.5, referencePrice: 43.2, note: "Demo stock position - not real trading data" },
    { assetClass: "stock", symbol: "CBA", name: "Demo CBA", market: "ASX", units: 6, avgEntryPrice: 124.0, referencePrice: 128.4, note: "Demo stock position - not real trading data" }
];

const COINSPOT_SUPPORTED_SYMBOLS = new Set(["ADA", "BNB", "BTC", "DOGE", "DOT", "ETH", "FET", "LTC", "NEAR", "THETA", "XLM"]);

const page = document.body.dataset.page;
const CRYPTO_ASSET_CLASS = "crypto";
const STOCK_ASSET_CLASS = "stock";
const UNKNOWN_ASSET_CLASS = "unknown";
const GITHUB_PAT_STORAGE_KEY = "zencloud.githubPat.v1";
const JOURNAL_FILTER_KEY = "zencloud.journalFilter.v1";
const KNOWN_CRYPTO_SYMBOLS = new Set([
    "BTC","ETH","BNB","ADA","DOT","LTC","XLM","DOGE","THETA","FET",
    "NEAR","ETC","TRB","XRP","SOL","AVAX","MATIC","LINK","UNI","AAVE",
    "ATOM","ALGO","MANA","SAND","CRV","SUSHI","YFI","SNX"
]);
const HOLDINGS_STORAGE_KEY = "zencloud.manualHoldings.v1";
const TRADE_JOURNAL_STORAGE_KEY = "zencloud.tradeJournal.v1";
const STOCK_JOURNAL_STORAGE_KEY = "zencloud.stocks.tradeJournal.v1";
const STOCK_HOLDINGS_STORAGE_KEY = "zencloud.stocks.holdings.v1";
const ANALYSIS_WATCHLIST_STORAGE_KEY = "zencloud.watchlist.v1";
const SIGNAL_HISTORY_STORAGE_KEY = "zencloud.signalHistory.v1";
const SESSION_CHECKLIST_STORAGE_KEY = "zencloud.sessionChecklist.v1";
const SESSION_CHECKLIST_ITEMS = [
    "Check Opportunity Queue",
    "Review holdings",
    "Analyse one asset",
    "Create trade plan",
    "Execute externally if appropriate",
    "Update holdings",
    "Log trade",
    "Review alerts"
];
let holdingsStorageInitialized = false;
let usingDefaultHoldings = false;
let selectedAssetId = null;
let planConfirmedAssetId = null;
let currentDashboardModel = null;
let currentJournalModel = null;
let portalMode = loadPortalMode();
let hideValues = loadPrivacyMode();
const savedPlanInputs = {};
let manualHoldings = loadHoldings();
let tradeJournal = loadCollection(TRADE_JOURNAL_STORAGE_KEY);
let analysisWatchlist = loadCollection(ANALYSIS_WATCHLIST_STORAGE_KEY);
let signalHistory = loadCollection(SIGNAL_HISTORY_STORAGE_KEY);
let sessionChecklist = loadChecklist();

const compactMoney = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    notation: "compact",
    maximumFractionDigits: 1
});

function formatPrice(value) {
    if (!Number.isFinite(value)) return "$0.00";
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: value >= 1 ? 2 : 6,
        maximumFractionDigits: value >= 1 ? 2 : 6
    }).format(value);
}

function maskMoney() {
    return "$••••";
}

function maskUnits() {
    return "•••• units";
}

function maskHidden() {
    return "Hidden";
}

function displayPrice(value) {
    return hideValues ? maskMoney() : formatPrice(value);
}

function displayMoneyText(value, formatter = formatPrice) {
    return hideValues ? maskMoney() : formatter(value);
}

function displayBalance(value, symbol = "") {
    if (hideValues) return symbol ? `•••• ${symbol}` : maskUnits();
    return formatBalance(value);
}

function displayEntry(value, fallback = "Entry not set") {
    if (hideValues) return maskMoney();
    return value ? formatPrice(value) : fallback;
}

function displayTradeValue(value, formatter = formatPrice) {
    return hideValues ? maskMoney() : formatter(value);
}

function displayPercentValue(value, formatter = formatSignedPercent) {
    return hideValues ? maskHidden() : formatter(value);
}

function formatBig(value) {
    if (!Number.isFinite(value)) return "$0.00";
    return compactMoney.format(value);
}

function formatPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0.00%";
    const arrow = numeric > 0 ? "▲" : numeric < 0 ? "▼" : "";
    return `${arrow}${Math.abs(numeric).toFixed(2)}%`;
}

function finiteNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function safeText(value, fallback) {
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

function storageAvailable() {
    try {
        const key = "__zencloud_storage_test__";
        window.localStorage.setItem(key, key);
        window.localStorage.removeItem(key);
        return true;
    } catch (error) {
        return false;
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
    if (storageAvailable()) {
        try {
            window.localStorage.setItem(PRIVACY_STORAGE_KEY, String(hideValues));
        } catch (error) {
            console.warn("Privacy mode preference update skipped.");
        }
    }
}

function loadPortalMode() {
    if (!storageAvailable()) return PUBLIC_DEMO_MODE;
    try {
        const stored = window.localStorage.getItem(PORTAL_MODE_STORAGE_KEY);
        return stored === PRIVATE_LOCAL_MODE ? PRIVATE_LOCAL_MODE : PUBLIC_DEMO_MODE;
    } catch (error) {
        return PUBLIC_DEMO_MODE;
    }
}

function savePortalMode(value) {
    portalMode = value === PRIVATE_LOCAL_MODE ? PRIVATE_LOCAL_MODE : PUBLIC_DEMO_MODE;
    if (storageAvailable()) {
        try {
            window.localStorage.setItem(PORTAL_MODE_STORAGE_KEY, portalMode);
        } catch (error) {
            console.warn("Portal mode preference update skipped.");
        }
    }
}

function isPublicDemoMode() {
    return portalMode !== PRIVATE_LOCAL_MODE;
}

function demoHoldings() {
    return DEMO_HOLDINGS.map(normalizeHolding);
}

function demoTradeJournal() {
    return DEMO_TRADE_JOURNAL.map(normalizeTrade);
}

function loadCollection(key) {
    if (isPublicDemoMode()) {
        if (key === TRADE_JOURNAL_STORAGE_KEY) return demoTradeJournal();
        if (key === STOCK_JOURNAL_STORAGE_KEY) return DEMO_STOCK_TRADE_JOURNAL;
        if (key === STOCK_HOLDINGS_STORAGE_KEY) return DEMO_STOCK_POSITIONS;
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
    if (storageAvailable()) {
        try {
            window.localStorage.setItem(key, JSON.stringify(cleanRows));
        } catch (error) {
            console.warn("Local storage update skipped.");
        }
    }
    return cleanRows;
}

function loadChecklist() {
    if (isPublicDemoMode()) {
        return SESSION_CHECKLIST_ITEMS.map(label => ({ label, checked: false }));
    }
    const stored = loadCollection(SESSION_CHECKLIST_STORAGE_KEY);
    if (!stored.length) {
        return SESSION_CHECKLIST_ITEMS.map(label => ({ label, checked: false }));
    }
    const byLabel = new Map(stored.map(item => [safeText(item.label, ""), Boolean(item.checked)]));
    return SESSION_CHECKLIST_ITEMS.map(label => ({ label, checked: byLabel.get(label) || false }));
}

function saveChecklist() {
    sessionChecklist = saveCollection(SESSION_CHECKLIST_STORAGE_KEY, sessionChecklist);
}

function normalizeHolding(holding = {}) {
    const symbol = safeText(holding.symbol, "").toUpperCase();
    const name = safeText(holding.name, symbol || "Unknown Asset");
    const rawEntry = Number(holding.avgEntryPrice);
    const avgEntryPrice = Number.isFinite(rawEntry) && rawEntry > 0 ? rawEntry : null;
    return {
        symbol,
        name,
        balance: Math.max(0, finiteNumber(holding.balance)),
        avgEntryPrice,
        note: safeText(holding.note, ""),
        updatedAt: safeText(holding.updatedAt, new Date().toISOString())
    };
}

function defaultHoldings() {
    return demoHoldings();
}

function isDefaultSampleSet(holdings) {
    if (!Array.isArray(holdings) || holdings.length !== DEMO_HOLDINGS.length) return false;
    const defaults = defaultHoldings();
    return defaults.every(defaultHolding => {
        const match = holdings.find(holding => holding.symbol === defaultHolding.symbol);
        return match
            && match.note === defaultHolding.note
            && match.balance === defaultHolding.balance;
    });
}

function isLegacyDefaultSampleSet(holdings) {
    if (!Array.isArray(holdings) || holdings.length !== LEGACY_DEFAULT_HOLDINGS.length) return false;
    return LEGACY_DEFAULT_HOLDINGS.every(defaultHolding => {
        const match = holdings.find(holding => holding.symbol === defaultHolding.symbol);
        return match
            && match.note === defaultHolding.note;
    });
}

function loadHoldings() {
    if (isPublicDemoMode()) {
        usingDefaultHoldings = true;
        return defaultHoldings();
    }
    if (!storageAvailable()) {
        usingDefaultHoldings = true;
        return defaultHoldings();
    }
    try {
        const stored = window.localStorage.getItem(HOLDINGS_STORAGE_KEY);
        if (stored === null) {
            usingDefaultHoldings = true;
            return defaultHoldings();
        }
        holdingsStorageInitialized = true;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            const normalized = parsed.map(normalizeHolding).filter(holding => holding.symbol);
            if (!normalized.length) {
                usingDefaultHoldings = true;
                return defaultHoldings();
            }
            if (isLegacyDefaultSampleSet(normalized)) {
                usingDefaultHoldings = true;
                return defaultHoldings();
            }
            usingDefaultHoldings = false;
            return normalized;
        }
        usingDefaultHoldings = true;
        return defaultHoldings();
    } catch (error) {
        usingDefaultHoldings = true;
        return defaultHoldings();
    }
}

function saveHoldings(holdings) {
    manualHoldings = Array.isArray(holdings)
        ? holdings.map(normalizeHolding).filter(holding => holding.symbol)
        : [];
    holdingsStorageInitialized = true;
    usingDefaultHoldings = false;
    if (isPublicDemoMode()) {
        setHoldingsMessage("Demo Mode: changes stay in this page only. Switch to Private Local Mode to save browser-local data.");
        return;
    }
    if (storageAvailable()) {
        try {
            window.localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(manualHoldings));
        } catch (error) {
            setHoldingsMessage("Holdings updated for this session only.");
        }
    }
}

function setHoldingsMessage(message, isError = false) {
    const el = document.getElementById("holdings-message");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", isError);
}

function formatBalance(value) {
    const numeric = finiteNumber(value);
    return numeric.toLocaleString("en-AU", { maximumFractionDigits: 10 });
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

function formatDateTimeLocal(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}

function holdingDuration(updatedAt) {
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
}

function formatSignedMoney(value) {
    if (!Number.isFinite(value)) return "$0.00";
    const sign = value > 0 ? "+" : "";
    return `${sign}${formatPrice(value)}`;
}

function formatSignedPercent(value) {
    if (!Number.isFinite(value)) return "0.00%";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

function percentClass(value) {
    const numeric = Number(value);
    if (numeric > 0) return "positive";
    if (numeric < 0) return "negative";
    return "neutral";
}

function byId(markets, id) {
    return Array.isArray(markets) ? markets.find(item => item.id === id) : undefined;
}

function marketForHolding(markets, holding) {
    const symbol = safeText(holding.symbol, "").toLowerCase();
    const name = safeText(holding.name, "").toLowerCase();
    if (!Array.isArray(markets)) return null;
    return markets.find(coin => coin.symbol.toLowerCase() === symbol)
        || markets.find(coin => coin.id.toLowerCase() === symbol || coin.id.toLowerCase() === name)
        || markets.find(coin => coin.name.toLowerCase() === name)
        || null;
}

function holdingDisplayCoin(markets, holding) {
    const market = marketForHolding(markets, holding);
    return market || {
        id: holding.symbol.toLowerCase(),
        symbol: holding.symbol.toLowerCase(),
        name: holding.name,
        current_price: 0,
        market_cap: 0,
        total_volume: 0,
        price_change_percentage_24h: 0,
        price_change_percentage_1h_in_currency: 0,
        image: "",
        sparkline_in_7d: { price: FALLBACK_SPARKLINE }
    };
}

function holdingValuation(markets, holding) {
    const market = marketForHolding(markets, holding);
    if (!market || !Number.isFinite(market.current_price) || market.current_price <= 0) {
        return { market: null, value: null };
    }
    return { market, value: holding.balance * market.current_price };
}

function unrealizedFor(row) {
    const entry = Number(row.holding.avgEntryPrice);
    const live = row.market?.current_price;
    if (!Number.isFinite(entry) || entry <= 0) return { aud: null, percent: null, label: "Entry not set" };
    if (!Number.isFinite(live) || live <= 0) return { aud: null, percent: null, label: "Price unavailable" };
    const aud = (live - entry) * row.holding.balance;
    const percent = ((live - entry) / entry) * 100;
    return { aud, percent, label: `${formatSignedMoney(aud)} / ${formatSignedPercent(percent)}` };
}

function coinspotUrl(coin) {
    return null;
}

function coinspotStatus(coin) {
    const symbol = safeText(coin?.symbol, "").toUpperCase();
    return COINSPOT_SUPPORTED_SYMBOLS.has(symbol) ? "Supported" : "Watch only";
}

function coinCell(coin) {
    const safeCoin = normalizeMarket(coin);
    const icon = safeCoin.image
        ? `<img class="coin-icon" src="${safeCoin.image}" alt="">`
        : `<span class="coin-icon"></span>`;
    return `<span class="coin">${icon}${escapeHtml(safeCoin.name)}</span>`;
}

function compactCoinName(coin) {
    const safeCoin = normalizeMarket(coin);
    return `${safeCoin.symbol.toUpperCase()} / ${safeCoin.name}`;
}

function journalId() {
    return `TJ-${Date.now().toString(36).toUpperCase()}`;
}

function normalizeTrade(trade = {}) {
    const entryPrice = Number(trade.entryPrice);
    const positionSize = Number(trade.positionSize);
    const hasExitPrice = trade.exitPrice !== "" && trade.exitPrice !== null && trade.exitPrice !== undefined;
    const exitPrice = hasExitPrice ? Number(trade.exitPrice) : NaN;
    const hasResultAud = trade.resultAud !== "" && trade.resultAud !== null && trade.resultAud !== undefined;
    const hasResultPercent = trade.resultPercent !== "" && trade.resultPercent !== null && trade.resultPercent !== undefined;
    const resultAud = hasResultAud ? Number(trade.resultAud) : NaN;
    const resultPercent = hasResultPercent ? Number(trade.resultPercent) : NaN;
    const assetClass = [CRYPTO_ASSET_CLASS, STOCK_ASSET_CLASS, UNKNOWN_ASSET_CLASS].includes(trade.assetClass)
        ? trade.assetClass
        : CRYPTO_ASSET_CLASS;
    const cleanEntryPrice = Number.isFinite(entryPrice) && entryPrice >= 0 ? entryPrice : 0;
    const cleanPositionSize = Number.isFinite(positionSize) && positionSize >= 0 ? positionSize : 0;
    const cleanExitPrice = Number.isFinite(exitPrice) && exitPrice >= 0 ? exitPrice : null;
    const calculatedResultAud = cleanExitPrice !== null && cleanEntryPrice > 0
        ? ((cleanExitPrice - cleanEntryPrice) * (cleanPositionSize / Math.max(cleanEntryPrice, 0.000001)))
        : null;
    const calculatedResultPercent = cleanExitPrice !== null && cleanEntryPrice > 0
        ? (((cleanExitPrice - cleanEntryPrice) / cleanEntryPrice) * 100)
        : null;
    return {
        id: safeText(trade.id, journalId()),
        assetClass,
        symbol: safeText(trade.symbol, "").toUpperCase(),
        name: safeText(trade.name, safeText(trade.symbol, "").toUpperCase() || "Unknown Asset"),
        entryDate: safeText(trade.entryDate, new Date().toISOString()),
        entryPrice: cleanEntryPrice,
        positionSize: cleanPositionSize,
        signalState: safeText(trade.signalState, "No Action"),
        reasonEntry: safeText(trade.reasonEntry, "Manual trade plan"),
        plannedInvalidation: safeText(trade.plannedInvalidation, "Review if risk state triggered"),
        exitDate: safeText(trade.exitDate, ""),
        exitPrice: cleanExitPrice,
        exitReason: safeText(trade.exitReason, ""),
        resultAud: Number.isFinite(resultAud) ? resultAud : calculatedResultAud,
        resultPercent: Number.isFinite(resultPercent) ? resultPercent : calculatedResultPercent,
        notes: safeText(trade.notes, ""),
        ruleFollowed: typeof trade.ruleFollowed === "boolean" ? trade.ruleFollowed : false,
        fromZenCloud: typeof trade.fromZenCloud === "boolean" ? trade.fromZenCloud : true,
        agentConsensus: safeText(trade.agentConsensus, "Not recorded"),
        mistakeType: safeText(trade.mistakeType, "Other"),
        lessonLearned: safeText(trade.lessonLearned, ""),
        status: trade.status === "closed" || cleanExitPrice !== null || safeText(trade.exitDate, "") ? "closed" : "open",
        updatedAt: safeText(trade.updatedAt, new Date().toISOString())
    };
}

function stockPlanAsTrade(plan = {}) {
    const symbol = safeText(plan.symbol, "").toUpperCase();
    return normalizeTrade({
        id: safeText(plan.id, stockIdForSharedJournal(plan)),
        assetClass: STOCK_ASSET_CLASS,
        symbol,
        name: safeText(plan.name, symbol || "Unknown Ticker"),
        entryDate: safeText(plan.recordedAt, new Date().toISOString()),
        entryPrice: plan.referencePrice ?? plan.entryPrice,
        positionSize: plan.positionSize ?? plan.allocation,
        signalState: safeText(plan.state, "Watch"),
        agentConsensus: "Stocks Workspace",
        reasonEntry: safeText(plan.whyNow ?? plan.thesis, "Manual stock plan"),
        plannedInvalidation: safeText(plan.invalidation, "Manual invalidation required"),
        notes: safeText(plan.notes ?? plan.brokerNote, "Broker execution not connected."),
        fromZenCloud: plan.fromZenCloud !== false,
        status: "open",
        updatedAt: safeText(plan.recordedAt, new Date().toISOString())
    });
}

function stockIdForSharedJournal(plan = {}) {
    const symbol = safeText(plan.symbol, "STOCK").toUpperCase();
    return `STOCK-${symbol}-${Date.now().toString(36).toUpperCase()}`;
}

function loadStockWorkspaceTrades() {
    return loadCollection(STOCK_JOURNAL_STORAGE_KEY).map(stockPlanAsTrade);
}

function normalizeStockPosition(position = {}) {
    const symbol = safeText(position.symbol, "").toUpperCase();
    return {
        assetClass: STOCK_ASSET_CLASS,
        symbol,
        name: safeText(position.name, symbol || "Unknown Ticker"),
        market: safeText(position.market, "Manual"),
        units: Math.max(0, finiteNumber(position.units)),
        avgEntryPrice: Math.max(0, finiteNumber(position.avgEntryPrice)),
        referencePrice: Math.max(0, finiteNumber(position.referencePrice)),
        note: safeText(position.note, "")
    };
}

function loadStockWorkspacePositions() {
    return loadCollection(STOCK_HOLDINGS_STORAGE_KEY).map(normalizeStockPosition);
}

function sharedJournalTrades() {
    return [
        ...tradeJournal.map(normalizeTrade),
        ...loadStockWorkspaceTrades()
    ];
}

function filterTradesByAssetClass(trades, filter = "all") {
    if (filter === CRYPTO_ASSET_CLASS || filter === STOCK_ASSET_CLASS) {
        return trades.filter(trade => trade.assetClass === filter || trade.assetClass === UNKNOWN_ASSET_CLASS);
    }
    return trades;
}

function currentReportAssetFilter() {
    return document.getElementById("report-asset-filter")?.value || "all";
}

function assetClassLabel(assetClass) {
    if (assetClass === STOCK_ASSET_CLASS) return "Stock";
    if (assetClass === UNKNOWN_ASSET_CLASS) return "?";
    return "Crypto";
}

function assetClassBadge(assetClass) {
    const label = assetClassLabel(assetClass);
    const klass = assetClass === STOCK_ASSET_CLASS ? "stock" : assetClass === UNKNOWN_ASSET_CLASS ? "unknown" : "crypto";
    return `<span class="asset-class-badge ${klass}">${label}</span>`;
}

function isStockWorkspaceRecord(trade) {
    return trade.assetClass === STOCK_ASSET_CLASS && String(trade.id).startsWith("STOCK-");
}

function saveTradeJournal() {
    tradeJournal = saveCollection(TRADE_JOURNAL_STORAGE_KEY, tradeJournal.map(normalizeTrade));
}

function addTrade(trade) {
    tradeJournal = [normalizeTrade(trade), ...tradeJournal];
    saveTradeJournal();
}

function updateTrade(id, patch) {
    tradeJournal = tradeJournal.map(trade => trade.id === id ? normalizeTrade({ ...trade, ...patch, updatedAt: new Date().toISOString() }) : trade);
    saveTradeJournal();
}

function deleteTrade(id) {
    tradeJournal = tradeJournal.filter(trade => trade.id !== id);
    saveTradeJournal();
}

function closeTrade(id, exitPrice, exitReason) {
    const trade = tradeJournal.find(row => row.id === id);
    if (!trade) return;
    const cleanExit = Number(exitPrice);
    if (!Number.isFinite(cleanExit) || cleanExit < 0 || trade.entryPrice <= 0) return;
    const units = trade.positionSize / Math.max(trade.entryPrice, 0.000001);
    const resultAud = (cleanExit - trade.entryPrice) * units;
    const resultPercent = ((cleanExit - trade.entryPrice) / trade.entryPrice) * 100;
    updateTrade(id, {
        status: "closed",
        exitDate: new Date().toISOString(),
        exitPrice: cleanExit,
        exitReason,
        resultAud,
        resultPercent
    });
}

function normalizeWatchItem(item = {}) {
    return {
        id: safeText(item.id, `${safeText(item.symbol, "asset").toLowerCase()}-${Date.now()}`),
        assetId: safeText(item.assetId, ""),
        symbol: safeText(item.symbol, "").toUpperCase(),
        name: safeText(item.name, safeText(item.symbol, "").toUpperCase() || "Unknown Asset"),
        reason: safeText(item.reason, "Manual watch"),
        signalAtWatch: safeText(item.signalAtWatch, "No Action"),
        watchedAt: safeText(item.watchedAt, new Date().toISOString())
    };
}

function saveAnalysisWatchlist() {
    analysisWatchlist = saveCollection(ANALYSIS_WATCHLIST_STORAGE_KEY, analysisWatchlist.map(normalizeWatchItem));
}

function addAnalysisWatch(item) {
    const clean = normalizeWatchItem(item);
    analysisWatchlist = [clean, ...analysisWatchlist.filter(row => row.symbol !== clean.symbol)];
    saveAnalysisWatchlist();
}

function removeAnalysisWatch(id) {
    analysisWatchlist = analysisWatchlist.filter(item => item.id !== id);
    saveAnalysisWatchlist();
}

function normalizeSparkline(coin) {
    const prices = coin?.sparkline_in_7d?.price;
    if (!Array.isArray(prices)) return { price: FALLBACK_SPARKLINE };
    const cleanPrices = prices.map(value => Number(value)).filter(Number.isFinite);
    return { price: cleanPrices.length ? cleanPrices : FALLBACK_SPARKLINE };
}

function normalizeMarketAsset(asset = {}, index = 0, source = MARKET_PROVIDERS.currentPublicFeed) {
    const idSeed = safeText(asset.id, safeText(asset.symbol, `asset-${index}`)).toLowerCase();
    const symbol = safeText(asset.symbol, idSeed || `asset-${index}`).toLowerCase();
    const name = safeText(asset.name, symbol.toUpperCase());
    const priceAud = finiteNumber(asset.priceAud ?? asset.current_price);
    const marketCapAud = finiteNumber(asset.marketCapAud ?? asset.market_cap);
    const volume24hAud = finiteNumber(asset.volume24hAud ?? asset.total_volume);
    const change1h = finiteNumber(asset.change1h ?? asset.price_change_percentage_1h_in_currency);
    const change24h = finiteNumber(asset.change24h ?? asset.price_change_percentage_24h);
    const change7d = Number(asset.change7d ?? asset.price_change_percentage_7d_in_currency);
    return {
        ...asset,
        id: idSeed,
        name,
        symbol,
        priceAud,
        marketCapAud,
        volume24hAud,
        change1h,
        change24h,
        change7d: Number.isFinite(change7d) ? change7d : null,
        rank: Number.isFinite(Number(asset.rank ?? asset.market_cap_rank)) ? Number(asset.rank ?? asset.market_cap_rank) : index + 1,
        source,
        lastUpdated: safeText(asset.lastUpdated, new Date().toISOString()),
        current_price: priceAud,
        market_cap: marketCapAud,
        total_volume: volume24hAud,
        price_change_percentage_24h: change24h,
        price_change_percentage_1h_in_currency: change1h,
        image: typeof asset.image === "string" ? asset.image : "",
        sparkline_in_7d: normalizeSparkline(asset)
    };
}

function normalizeCurrentPublicFeedAsset(coin = {}, index = 0) {
    return normalizeMarketAsset({
        ...coin,
        priceAud: coin.current_price,
        marketCapAud: coin.market_cap,
        volume24hAud: coin.total_volume,
        change1h: coin.price_change_percentage_1h_in_currency,
        change24h: coin.price_change_percentage_24h,
        rank: coin.market_cap_rank
    }, index, MARKET_PROVIDERS.currentPublicFeed);
}

function normalizeCoinMarketCapProxyAsset(asset = {}, index = 0) {
    const quote = asset.quote?.AUD || asset.quote?.USD || {};
    return normalizeMarketAsset({
        id: asset.slug || asset.id || asset.symbol,
        symbol: asset.symbol,
        name: asset.name,
        priceAud: asset.priceAud ?? quote.price,
        marketCapAud: asset.marketCapAud ?? quote.market_cap,
        volume24hAud: asset.volume24hAud ?? quote.volume_24h,
        change1h: asset.change1h ?? quote.percent_change_1h,
        change24h: asset.change24h ?? quote.percent_change_24h,
        change7d: asset.change7d ?? quote.percent_change_7d,
        rank: asset.cmc_rank || asset.rank,
        lastUpdated: asset.last_updated || asset.lastUpdated,
        image: asset.image || ""
    }, index, MARKET_PROVIDERS.coinMarketCapProxy);
}

function normalizeMarket(coin = {}, index = 0) {
    return normalizeMarketAsset(coin, index, coin.source || MARKET_PROVIDERS.currentPublicFeed);
}

function normalizeMarkets(markets, provider = MARKET_PROVIDERS.currentPublicFeed) {
    const sourceRows = Array.isArray(markets) && markets.length ? markets : FALLBACK_MARKETS;
    return sourceRows.map((asset, index) => provider === MARKET_PROVIDERS.coinMarketCapProxy
        ? normalizeCoinMarketCapProxyAsset(asset, index)
        : provider === MARKET_PROVIDERS.currentPublicFeed
            ? normalizeCurrentPublicFeedAsset(asset, index)
            : normalizeMarketAsset(asset, index, provider));
}

function fallbackMarkets() {
    return normalizeMarkets(FALLBACK_MARKETS, MARKET_PROVIDERS.fallbackSnapshot);
}

function warnFallbackOnce() {
    if (fallbackWarningShown) return;
    fallbackWarningShown = true;
    console.warn("Live API unavailable; rendering fallback snapshot.");
}

function classifyFetchFailure(error, response) {
    if (response?.status === 429) return "Rate limited / HTTP 429";
    if (response?.status === 503) return "Service unavailable / HTTP 503";
    if (error?.name === "AbortError") return "Network timeout";
    const message = String(error?.message || "");
    if (/429/.test(message)) return "Rate limited / HTTP 429";
    if (/503/.test(message)) return "Service unavailable / HTTP 503";
    if (/CORS|blocked|Failed to fetch|NetworkError|fetch/i.test(message)) return "CORS or fetch blocked";
    if (/Malformed/i.test(message)) return "Malformed API response";
    if (/Empty/i.test(message)) return "Empty API response";
    return "Unknown error";
}

function logDetailedFetchErrorOnce(error) {
    if (detailedFetchErrorLogged) return;
    detailedFetchErrorLogged = true;
    console.warn("Market data fetch failed; fallback snapshot active.", error);
}

function setNextRetryLabel() {
    const next = new Date(Date.now() + REFRESH_INTERVAL_MS);
    dataConfidence.nextRetryTime = next.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

function shouldForceFallback() {
    return new URLSearchParams(window.location.search).has("forceFallback");
}

function compactConfidenceMessage() {
    if (dataConfidence.isFallback) {
        const lastLive = dataConfidence.lastSuccessfulLiveFetch
            ? new Date(dataConfidence.lastSuccessfulLiveFetch).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
            : "none";
        return `Fallback Snapshot — review/planning only. ${dataConfidence.failureReason}. Last live: ${lastLive}`;
    }
    return `${dataConfidence.mode} · ${dataConfidence.provider}`;
}

function renderDataConfidence() {
    document.querySelectorAll("[data-confidence-field]").forEach(el => {
        const field = el.dataset.confidenceField;
        const valueMap = {
            provider: dataConfidence.provider,
            plannedProvider: dataConfidence.plannedProvider,
            mode: dataConfidence.mode,
            lastStatusUpdate: dataConfidence.lastStatusUpdate ? formatTimestamp(dataConfidence.lastStatusUpdate) : "Pending",
            lastSuccessfulLiveFetch: dataConfidence.lastSuccessfulLiveFetch ? formatTimestamp(dataConfidence.lastSuccessfulLiveFetch) : "Not recorded",
            lastAttemptedFetch: dataConfidence.lastAttemptedFetch ? formatTimestamp(dataConfidence.lastAttemptedFetch) : "Not recorded",
            failureReason: dataConfidence.failureReason || "None",
            retryCount: String(dataConfidence.retryCount),
            nextRetryTime: dataConfidence.nextRetryTime || "next refresh",
            dataKind: dataConfidence.dataKind || (dataConfidence.isFallback ? "Fallback" : "Live")
        };
        el.textContent = valueMap[field] || "Not recorded";
    });
    document.body.classList.toggle("fallback-active", Boolean(dataConfidence.isFallback));
}

function rerenderCurrentPage() {
    if (page === "dashboard" && currentDashboardModel) renderDashboard(currentDashboardModel);
    if (page === "journal") renderJournal();
    if (page === "reports" && currentReportModel) renderReports(currentReportModel);
}

function reloadPortalData() {
    manualHoldings = loadHoldings();
    tradeJournal = loadCollection(TRADE_JOURNAL_STORAGE_KEY);
    analysisWatchlist = loadCollection(ANALYSIS_WATCHLIST_STORAGE_KEY);
    signalHistory = loadCollection(SIGNAL_HISTORY_STORAGE_KEY);
    sessionChecklist = loadChecklist();
    planConfirmedAssetId = null;
}

function updatePortalModeDisplay() {
    const isDemo = isPublicDemoMode();
    document.body.classList.toggle("public-demo-mode", isDemo);
    document.body.classList.toggle("private-local-mode", !isDemo);
    document.querySelectorAll("[data-portal-mode-label]").forEach(el => {
        el.textContent = isDemo ? "Public Demo" : "Private Local";
    });
    document.querySelectorAll("[data-demo-message]").forEach(el => {
        el.hidden = !isDemo;
    });
}

function initPortalModeControls() {
    const topbar = document.querySelector(".topbar");
    if (!topbar || document.getElementById("portal-mode-select")) return;
    const label = document.createElement("label");
    label.className = "privacy-toggle";
    label.innerHTML = `
        <span>Mode: <strong data-portal-mode-label>${isPublicDemoMode() ? "Public Demo" : "Private Local"}</strong></span>
        <select id="portal-mode-select" aria-label="Portal privacy mode">
            <option value="${PUBLIC_DEMO_MODE}" ${isPublicDemoMode() ? "selected" : ""}>Public Demo Mode</option>
            <option value="${PRIVATE_LOCAL_MODE}" ${!isPublicDemoMode() ? "selected" : ""}>Private Local Mode</option>
        </select>
    `;
    topbar.appendChild(label);
    const status = document.createElement("div");
    status.className = "privacy-status-line";
    status.innerHTML = `
        <span><strong data-portal-mode-label>${isPublicDemoMode() ? "Public Demo" : "Private Local"}</strong>: Public GitHub Pages files are visible to anyone. Private data stays in this browser.</span>
        <span data-demo-message>Demo data — not real trading data.</span>
    `;
    document.querySelector(".topbar")?.insertAdjacentElement("afterend", status);
    document.getElementById("portal-mode-select")?.addEventListener("change", event => {
        savePortalMode(event.currentTarget.value);
        reloadPortalData();
        updatePortalModeDisplay();
        rerenderCurrentPage();
    });
    updatePortalModeDisplay();
}

function initPrivacyToggle() {
    const topbar = document.querySelector(".topbar");
    if (!topbar || document.getElementById("hide-values-toggle")) return;
    const label = document.createElement("label");
    label.className = "privacy-toggle";
    label.innerHTML = `
        <input id="hide-values-toggle" type="checkbox" ${hideValues ? "checked" : ""}>
        <span>Hide Values</span>
    `;
    topbar.appendChild(label);
    document.body.classList.toggle("values-hidden", hideValues);
    label.querySelector("input").addEventListener("change", event => {
        savePrivacyMode(event.currentTarget.checked);
        document.body.classList.toggle("values-hidden", hideValues);
        rerenderCurrentPage();
    });
}

function initMasterRuleFooter() {
    if (document.querySelector(".master-rule-footer")) return;
    const footer = document.createElement("footer");
    footer.className = "master-rule-footer";
    footer.innerHTML = `<strong>${MASTER_RULE}</strong><span>ZenCloud decides. CoinSpot executes. ZenCloud records and reviews.</span><span>${PUBLIC_PRIVACY_WARNING}</span><span>${PUBLIC_SITE_RULE}</span>`;
    document.body.appendChild(footer);
}

function setStatus(message = compactConfidenceMessage(), isLive = true) {
    dataConfidence.lastStatusUpdate = new Date().toISOString();
    document.querySelectorAll("#market-status").forEach(el => {
        el.textContent = message;
    });
    document.querySelectorAll(".status-dot").forEach(el => {
        el.style.background = isLive ? "var(--cyan)" : "var(--amber)";
    });
    renderDataConfidence();
}

function setLastUpdatedLabel() {
    const el = document.getElementById("last-updated");
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

async function getMarkets() {
    dataConfidence.lastAttemptedFetch = new Date().toISOString();
    setNextRetryLabel();
    const proxyUrl = safeText(MARKET_DATA_PROXY_URL, "");
    const provider = proxyUrl ? MARKET_PROVIDERS.coinMarketCapProxy : MARKET_PROVIDERS.currentPublicFeed;
    const params = new URLSearchParams({
        vs_currency: "aud",
        order: "market_cap_desc",
        per_page: "250",
        page: "1",
        sparkline: "true",
        price_change_percentage: "1h,24h"
    });

    try {
        if (shouldForceFallback()) {
            const error = new Error("Forced fallback snapshot");
            error.failureReason = "Forced fallback snapshot";
            throw error;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const url = proxyUrl || `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`;
        const headers = { "accept": "application/json" };
        const response = await fetch(url, {
            headers,
            cache: "no-store",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const error = new Error(`${provider} HTTP ${response.status}`);
            error.failureReason = classifyFetchFailure(error, response);
            throw error;
        }
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            const error = new Error("Malformed API response");
            error.failureReason = "Malformed API response";
            throw error;
        }
        const rows = provider === MARKET_PROVIDERS.coinMarketCapProxy ? (Array.isArray(data?.data) ? data.data : data) : data;
        if (!Array.isArray(rows)) {
            const error = new Error("Malformed API response");
            error.failureReason = "Malformed API response";
            throw error;
        }
        if (!rows.length) {
            const error = new Error("Empty API response");
            error.failureReason = "Empty API response";
            throw error;
        }
        dataConfidence.mode = "Live Data";
        dataConfidence.provider = provider;
        dataConfidence.lastSuccessfulLiveFetch = new Date().toISOString();
        dataConfidence.failureReason = "None";
        dataConfidence.retryCount = 0;
        dataConfidence.isFallback = false;
        dataConfidence.dataKind = "Live";
        setStatus(compactConfidenceMessage(), true);
        setLastUpdatedLabel();
        return normalizeMarkets(rows, provider);
    } catch (error) {
        dataConfidence.mode = "Fallback Snapshot";
        dataConfidence.provider = MARKET_PROVIDERS.fallbackSnapshot;
        dataConfidence.failureReason = error.failureReason || classifyFetchFailure(error);
        dataConfidence.retryCount += 1;
        dataConfidence.isFallback = true;
        dataConfidence.dataKind = "Fallback";
        logDetailedFetchErrorOnce(error);
        warnFallbackOnce();
        setStatus(compactConfidenceMessage() || FALLBACK_STATUS, false);
        setLastUpdatedLabel();
        return fallbackMarkets();
    }
}

function sellPrice(price) {
    return finiteNumber(price) * 0.99015;
}

function renderDashboard(model) {
    currentDashboardModel = model;
    const { markets, rankedAssets } = model;
    const watchlist = rankedAssets.filter(item => WATCHLIST_IDS.includes(item.coin.id));
    const opportunityRows = rankedAssets.slice(0, 10);
    const selected = rankedAssets.find(item => item.coin.id === selectedAssetId);
    const holdingRows = manualHoldings.map(holding => {
        const displayCoin = holdingDisplayCoin(markets, holding);
        const valuation = holdingValuation(markets, holding);
        return { holding, displayCoin, ...valuation };
    });
    const portfolioValue = holdingRows.reduce((total, row) => total + (row.value ?? 0), 0);
    const pricedRows = holdingRows.filter(row => row.value !== null && row.holding.balance > 0);
    updateCommandStatus(holdingRows, portfolioValue);
    document.querySelector(".command-status")?.classList.toggle("is-fallback", Boolean(model.dataConfidence?.isFallback));
    renderMarketRegime(model);

    document.getElementById("opportunities-body").innerHTML = opportunityRows.map(item => `
        <tr class="${item.coin.id === selectedAssetId ? "selected-row" : ""}">
            <td>${coinCell(item.coin)}</td>
            <td><span class="badge ${item.decision.klass}">${item.decision.label}</span></td>
            <td class="num">${item.decision.score}</td>
            <td class="num">${formatPrice(item.coin.current_price)}</td>
            <td class="num ${percentClass(item.coin.price_change_percentage_1h_in_currency)}">${formatPercent(item.coin.price_change_percentage_1h_in_currency)}</td>
            <td class="num ${percentClass(item.coin.price_change_percentage_24h)}">${formatPercent(item.coin.price_change_percentage_24h)}</td>
            <td><button class="table-action" type="button" data-asset-id="${item.coin.id}">Analyse</button></td>
        </tr>
    `).join("");
    renderBestSwingMover(rankedAssets);
    renderHighestExitRisk(rankedAssets, holdingRows);
    renderTradeGuide(opportunityRows);

    const PLAN_INPUT_IDS = ["plan-reason", "plan-trigger", "plan-invalidation", "plan-review",
        "plan-window", "plan-size", "plan-notes", "size-portfolio",
        "risk-percent", "risk-entry", "risk-invalid-price", "size-risk-amount", "size-allocation"];
    if (selectedAssetId) {
        const snap = {};
        let hadInputs = false;
        PLAN_INPUT_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) { snap[id] = el.value; hadInputs = true; }
        });
        document.querySelectorAll("[data-handoff-check]").forEach(el => {
            snap[`_check_${el.dataset.handoffCheck}`] = el.checked;
        });
        if (hadInputs) savedPlanInputs[selectedAssetId] = snap;
    }

    document.getElementById("analysis-panel").innerHTML = selected
        ? analysisHtml(selected, portfolioValue)
        : `<div class="empty-analysis">Select an asset from the Opportunity Queue to inspect structure, plan the trade, and unlock execution handoff.</div>`;

    if (selected && savedPlanInputs[selected.coin.id]) {
        const snap = savedPlanInputs[selected.coin.id];
        Object.entries(snap).forEach(([key, value]) => {
            if (key.startsWith("_check_")) {
                const el = document.querySelector(`[data-handoff-check="${key.replace("_check_", "")}"]`);
                if (el) el.checked = value;
            } else {
                const el = document.getElementById(key);
                if (el) el.value = value;
            }
        });
    }

    document.querySelectorAll("[data-asset-id]").forEach(button => {
        button.addEventListener("click", event => {
            selectedAssetId = event.currentTarget.dataset.assetId;
            renderDashboard(model);
        });
    });

    document.getElementById("watchlist-body").innerHTML = watchlist.map(item => `
        <tr>
            <td>${coinCell(item.coin)}</td>
            <td><span class="badge ${item.decision.klass}">${item.decision.label}</span></td>
            <td class="num">${item.decision.score}</td>
            <td class="num">${formatPrice(item.coin.current_price)}</td>
            <td class="num">${formatPrice(sellPrice(item.coin.current_price))}</td>
            <td class="num ${percentClass(item.coin.price_change_percentage_24h)}">${formatPercent(item.coin.price_change_percentage_24h)}</td>
        </tr>
    `).join("");

    document.getElementById("wallets-body").innerHTML = holdingRows.length ? holdingRows.map(row => {
        const unrealized = unrealizedFor(row);
        return `
            <tr>
                <td>${coinCell(row.displayCoin)}</td>
                <td class="num">${displayBalance(row.holding.balance, row.holding.symbol)}</td>
                <td class="num">${row.market ? formatPrice(row.market.current_price) : "Price unavailable"}</td>
                <td class="num">${displayEntry(row.holding.avgEntryPrice)}</td>
                <td class="num ${unrealized.aud > 0 ? "positive" : unrealized.aud < 0 ? "negative" : "neutral"}">${hideValues ? maskMoney() : unrealized.label}</td>
                <td>${holdingDuration(row.holding.updatedAt)}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="6" class="loading-cell">No manual holdings saved.</td></tr>`;

    document.getElementById("portfolio-value").textContent = displayPrice(portfolioValue);
    renderHoldingsAllocation(holdingRows, portfolioValue);
    renderHoldingsManager(markets, holdingRows);
    renderPositionMonitor(rankedAssets, holdingRows);

    renderMarketAttention(markets);

    const recent = [...markets].sort((a, b) =>
        Math.abs(b.price_change_percentage_1h_in_currency || 0) - Math.abs(a.price_change_percentage_1h_in_currency || 0)
    ).slice(0, 6);
    const recentMoversBody = document.getElementById("recent-movers-body");
    if (recentMoversBody) recentMoversBody.innerHTML = recent.map(coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_1h_in_currency)}">${formatPercent(coin.price_change_percentage_1h_in_currency)}</td>
        </tr>
    `).join("");

    renderTodayMovers(markets);

    const newCoins = [...markets]
        .filter(coin => coin.current_price > 0 && coin.total_volume > 0)
        .slice(-8)
        .reverse();
    const newCoinsBody = document.getElementById("new-coins-body");
    if (newCoinsBody) newCoinsBody.innerHTML = newCoins.map(coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num">${formatBig(coin.total_volume)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_24h)}">${formatPercent(coin.price_change_percentage_24h)}</td>
        </tr>
    `).join("") || `<tr><td colspan="4" class="loading-cell">No scan candidates available.</td></tr>`;
    renderAnalysisWatchlist(rankedAssets);
    renderSignalHistory();
    renderSessionChecklist();
    renderPerformanceSummary("dashboard-performance-summary");
    attachAnalysisControls(selected, portfolioValue);
}

function updateCommandStatus(holdingRows, portfolioValue) {
    const portfolioEl = document.getElementById("status-portfolio-value");
    const holdingEl = document.getElementById("status-holding-summary");
    if (portfolioEl) portfolioEl.textContent = displayPrice(portfolioValue);
    const modeEl = document.getElementById("session-mode");
    const activeRows = holdingRows.filter(row => row.holding.balance > 0);
    if (modeEl) {
        const openTrades = tradeJournal.map(normalizeTrade).filter(trade => trade.status !== "closed").length;
        modeEl.textContent = selectedAssetId
            ? planConfirmedAssetId === selectedAssetId ? "Planning" : "Analysing"
            : openTrades || activeRows.length ? "In Position" : "Scanning";
    }
    if (!holdingEl) return;
    if (!activeRows.length) {
        holdingEl.textContent = "No active holdings";
        return;
    }
    const lead = [...activeRows].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
    const valueText = lead.value === null ? "Price unavailable" : displayPrice(lead.value);
    holdingEl.textContent = `${lead.holding.symbol} ${displayBalance(lead.holding.balance, lead.holding.symbol)} / ${valueText}`;
}

function renderMarketRegime(model) {
    const el = document.getElementById("market-regime-panel");
    if (!el) return;
    const markets = model.markets || [];
    const unavailableHtml = `<div class="loading-cell">Market regime unavailable.</div>`;
    if (!markets.length) {
        el.innerHTML = unavailableHtml;
        return;
    }
    const topMarkets = markets.slice(0, 30);
    const totalCap = markets.reduce((total, coin) => total + finiteNumber(coin.marketCapAud ?? coin.market_cap), 0);
    const totalVolume = markets.reduce((total, coin) => total + finiteNumber(coin.volume24hAud ?? coin.total_volume), 0);
    const btc = markets.find(coin => safeText(coin.symbol, "").toUpperCase() === "BTC");
    const eth = markets.find(coin => safeText(coin.symbol, "").toUpperCase() === "ETH");
    const btcCap = btc ? finiteNumber(btc.marketCapAud ?? btc.market_cap, NaN) : NaN;
    const ethCap = eth ? finiteNumber(eth.marketCapAud ?? eth.market_cap, NaN) : NaN;
    const changes24h = topMarkets.map(coin => finiteNumber(coin.change24h ?? coin.price_change_percentage_24h, NaN)).filter(Number.isFinite);
    const altChanges24h = markets
        .filter(coin => !["BTC", "ETH"].includes(safeText(coin.symbol, "").toUpperCase()))
        .slice(0, 30)
        .map(coin => finiteNumber(coin.change24h ?? coin.price_change_percentage_24h, NaN))
        .filter(Number.isFinite);
    if (totalCap <= 0 || totalVolume <= 0 || !Number.isFinite(btcCap) || !Number.isFinite(ethCap) || !changes24h.length || !altChanges24h.length) {
        el.innerHTML = unavailableHtml;
        return;
    }
    const btcDominance = (btcCap / totalCap) * 100;
    const ethDominance = (ethCap / totalCap) * 100;
    const avgMove = average(changes24h);
    const highVolatility = changes24h.filter(change => Math.abs(change) >= 5).length >= 8;
    const lowLiquidity = totalVolume < 50000000000;
    const altAvg = average(altChanges24h);
    const label = lowLiquidity
        ? "Low Liquidity"
        : highVolatility
            ? "High Volatility"
            : btcDominance !== null && btcDominance >= 48 && avgMove > 0
                ? "BTC-Led Market"
                : altAvg > avgMove + 1 && avgMove > 0
                    ? "Altcoin Rotation"
                    : avgMove >= 1.5 ? "Risk-On" : avgMove <= -1.5 ? "Risk-Off" : "Cautious";
    el.innerHTML = `
        <div class="regime-header">
            <span>Market Regime</span>
            <strong>${label || "Unknown"}</strong>
        </div>
        <div class="regime-grid">
            <span><small>Total cap</small><strong>${formatBig(totalCap)}</strong></span>
            <span><small>24h volume</small><strong>${formatBig(totalVolume)}</strong></span>
            <span><small>BTC dominance</small><strong>${btcDominance.toFixed(1)}%</strong></span>
            <span><small>ETH dominance</small><strong>${ethDominance.toFixed(1)}%</strong></span>
            <span><small>24h breadth</small><strong>${avgMove >= 0 ? "+" : ""}${avgMove.toFixed(2)}%</strong></span>
            <span><small>Alt rotation</small><strong>${altAvg > avgMove + 1 ? "Rotation watch" : "Not confirmed"}</strong></span>
            <span><small>Source</small><strong>${escapeHtml(model.dataConfidence?.provider || "Current Feed")}</strong></span>
            <span><small>Updated</small><strong>${formatTimestamp(model.dataConfidence?.lastStatusUpdate || new Date().toISOString())}</strong></span>
        </div>
    `;
}

function attentionRow(coin) {
    return `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPercent(coin.change24h ?? coin.price_change_percentage_24h)}</td>
            <td>${coinspotStatus(coin)}</td>
        </tr>
    `;
}

function renderAttentionTable(id, rows) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = rows.length ? rows.map(attentionRow).join("") : `<tr><td colspan="3" class="loading-cell">No market context available.</td></tr>`;
}

function renderMarketAttention(markets) {
    const safe = Array.isArray(markets) ? markets : [];
    const byVolume = [...safe].sort((a, b) => finiteNumber(b.volume24hAud ?? b.total_volume) - finiteNumber(a.volume24hAud ?? a.total_volume));
    const byGain = [...safe].sort((a, b) => finiteNumber(b.change24h ?? b.price_change_percentage_24h) - finiteNumber(a.change24h ?? a.price_change_percentage_24h));
    const byLoss = [...safe].sort((a, b) => finiteNumber(a.change24h ?? a.price_change_percentage_24h) - finiteNumber(b.change24h ?? b.price_change_percentage_24h));
    renderAttentionTable("attention-trending", byVolume.slice(0, 5));
    renderAttentionTable("attention-gainers", byGain.slice(0, 5));
    renderAttentionTable("attention-losers", byLoss.slice(0, 5));
    renderAttentionTable("attention-visited", byVolume.slice(5, 10));
    renderAttentionTable("attention-recent", safe.slice(-5).reverse());
}

function itemForHolding(items, holding) {
    return items.find(asset => asset.coin.symbol.toUpperCase() === holding.symbol || asset.coin.name.toLowerCase() === holding.name.toLowerCase()) || null;
}

function renderPositionMonitor(items, holdingRows) {
    const body = document.getElementById("position-monitor-body");
    if (!body) return;
    const rows = holdingRows.filter(row => row.holding.balance > 0);
    body.innerHTML = rows.length ? rows.map(row => {
        const item = itemForHolding(items, row.holding);
        const unrealized = unrealizedFor(row);
        const signal = item ? guideStateFor(item).label : "No Action";
        const exitRisk = item
            ? (signal === "Sell Risk" || riskFor(item) === "High" || finiteNumber(item.coin.change24h ?? item.coin.price_change_percentage_24h) < 0 ? "Review Position" : "No elevated exit risk")
            : "Price unavailable";
        const status = exitRisk === "Review Position" ? "Review" : signal === "Sell Risk" ? "Plan Exit" : "Hold";
        return `
            <tr>
                <td>${escapeHtml(row.holding.symbol)} / ${escapeHtml(row.holding.name)}</td>
                <td class="num">${displayBalance(row.holding.balance, row.holding.symbol)}</td>
                <td class="num">${displayEntry(row.holding.avgEntryPrice)}</td>
                <td class="num">${row.market ? formatPrice(row.market.current_price) : "Price unavailable"}</td>
                <td class="num ${unrealized.aud > 0 ? "positive" : unrealized.aud < 0 ? "negative" : "neutral"}">${unrealized.aud === null ? (hideValues ? maskMoney() : unrealized.label) : displayMoneyText(unrealized.aud, formatSignedMoney)}</td>
                <td class="num ${unrealized.percent > 0 ? "positive" : unrealized.percent < 0 ? "negative" : "neutral"}">${unrealized.percent === null ? (hideValues ? maskHidden() : unrealized.label) : displayPercentValue(unrealized.percent)}</td>
                <td>${escapeHtml(signal)}</td>
                <td>${escapeHtml(exitRisk)}</td>
                <td>${holdingDuration(row.holding.updatedAt)}</td>
                <td>${escapeHtml(status)}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="10" class="loading-cell">No active holdings.</td></tr>`;
}

function analysisHtml(selected, portfolioValue) {
    const state = guideStateFor(selected);
    const confirmed = planConfirmedAssetId === selected.coin.id;
    const fallbackLocked = Boolean(dataConfidence.isFallback);
    const selectedCoinspotUrl = confirmed && !fallbackLocked ? coinspotUrl(selected.coin) : null;
    const defaultSize = Math.max(0, portfolioValue * 0.1);
    const consensus = agentConsensusFor(selected, portfolioValue);
    const handoffText = fallbackLocked
        ? "Live data unavailable. Review only."
        : confirmed ? "Checklist complete. Execution handoff is available for this asset." : "Complete the checklist before execution handoff.";
    return `
        <div class="analysis-heading">
            ${coinCell(selected.coin)}
            <span class="badge ${state.klass}">${state.label}</span>
        </div>
        <dl class="metric-grid">
            <div><dt>Score</dt><dd>${selected.decision.score}</dd></div>
            <div><dt>Price</dt><dd>${formatPrice(selected.coin.current_price)}</dd></div>
            <div><dt>1hr</dt><dd class="${percentClass(selected.coin.price_change_percentage_1h_in_currency)}">${formatPercent(selected.coin.price_change_percentage_1h_in_currency)}</dd></div>
            <div><dt>24hr</dt><dd class="${percentClass(selected.coin.price_change_percentage_24h)}">${formatPercent(selected.coin.price_change_percentage_24h)}</dd></div>
            <div><dt>Volume</dt><dd>${formatBig(selected.coin.total_volume)}</dd></div>
            <div><dt>Risk</dt><dd>${riskFor(selected)}</dd></div>
        </dl>
        <div class="invalidation-box">
            <strong>Invalidation</strong>
            <span>${invalidationSentence(state.label)}</span>
        </div>
        <div class="agent-consensus">
            <div class="mini-title">Agent Consensus <span class="badge wait">${consensus.label}</span></div>
            <div class="consensus-grid">
                ${consensus.agents.map(agent => `
                    <span><small>${agent.name}</small><strong>${agent.result}</strong><em>${agent.reason}</em></span>
                `).join("")}
            </div>
        </div>
        <div class="trade-plan-box">
            <div class="mini-title">Trade Plan</div>
            <label>Why now?<textarea id="plan-reason">${escapeHtml(swingReasonFor(selected))}</textarea></label>
            <label>Entry trigger<input id="plan-trigger" type="text" value="${escapeHtml(state.label)} confirmation"></label>
            <label>Invalidation<input id="plan-invalidation" type="text" value="${escapeHtml(invalidationSentence(state.label))}"></label>
            <label>Target review time<input id="plan-review" type="datetime-local" value="${formatDateTimeLocal(Date.now() + 86400000)}"></label>
            <label>Expected holding window<input id="plan-window" type="text" value="1-7 days"></label>
            <label>Intended position size<input id="plan-size" type="${hideValues ? "password" : "number"}" min="0" step="any" value="${hideValues ? maskMoney() : defaultSize.toFixed(2)}" ${hideValues ? "disabled" : ""}></label>
            <label>Notes<textarea id="plan-notes" placeholder="Manual notes"></textarea></label>
            <div class="form-actions">
                <button class="table-action" type="button" id="confirm-plan">Confirm Checklist</button>
                <button class="table-action" type="button" id="save-plan-journal">Save to Journal</button>
                <button class="table-action" type="button" id="add-analysis-watch">Add to Watch</button>
            </div>
        </div>
        <div class="position-helper">
            <div class="mini-title">Risk Per Trade</div>
            <div class="size-grid">
                <label>Account value<input id="size-portfolio" type="${hideValues ? "password" : "number"}" min="0" step="any" value="${hideValues ? maskMoney() : portfolioValue.toFixed(2)}" ${hideValues ? "disabled" : ""}></label>
                <label>Risk per trade %<input id="risk-percent" type="number" min="0" step="any" value="2"></label>
                <label>Entry price<input id="risk-entry" type="number" min="0" step="any" value="${selected.coin.current_price}"></label>
                <label>Invalidation price<input id="risk-invalid-price" type="number" min="0" step="any" value="${Math.max(0, selected.coin.current_price * 0.95).toFixed(6)}"></label>
                <label>Max risk AUD<input id="size-risk-amount" type="${hideValues ? "password" : "number"}" min="0" step="any" value="${hideValues ? maskMoney() : Math.max(0, portfolioValue * 0.02).toFixed(2)}" ${hideValues ? "disabled" : ""}></label>
                <label>Allocation %<input id="size-allocation" type="number" min="0" step="any" value="10"></label>
            </div>
            <div class="helper-output" id="size-output">Sizing helper only. Final trade decision is external.</div>
        </div>
        <div class="handoff-checklist">
            <div class="mini-title">CoinSpot Handoff Checklist <span class="checklist-progress" id="checklist-progress">${confirmed ? "5 / 5" : "0 / 5"} checks</span></div>
            ${["Plan created", "Position size checked", "Invalidation set", "Holding impact reviewed", "Journal reminder acknowledged"].map((label, index) => `
                <label class="check-row"><input type="checkbox" data-handoff-check="${index}" ${confirmed ? "checked" : ""}><span>${label}</span></label>
            `).join("")}
        </div>
        <div class="execution-bar">
            <span>${handoffText}<small>${MASTER_RULE}</small></span>
            ${selectedCoinspotUrl
                ? `<a class="button-primary" href="${selectedCoinspotUrl}" target="_blank" rel="noopener noreferrer">Open CoinSpot</a>`
                : fallbackLocked ? `<span class="watch-only handoff-locked">Live data unavailable. Review only.</span>`
                    : confirmed ? `<span class="watch-only">Manual CoinSpot execution only</span>` : `<span class="watch-only">Plan required</span>`}
        </div>
    `;
}

function attachAnalysisControls(selected, portfolioValue) {
    if (!selected) return;
    const updateSizing = () => {
        const out = document.getElementById("size-output");
        if (!out) return;
        if (hideValues) {
            out.textContent = "Sizing values hidden for screen sharing. Disable Hide Values to edit the sizing helper.";
            return;
        }
        const portfolio = Math.max(0, finiteNumber(document.getElementById("size-portfolio")?.value, portfolioValue));
        const allocation = Math.max(0, finiteNumber(document.getElementById("size-allocation")?.value, 0));
        const riskPercent = Math.max(0, finiteNumber(document.getElementById("risk-percent")?.value, 0));
        const entry = Math.max(0, finiteNumber(document.getElementById("risk-entry")?.value, selected.coin.current_price));
        const invalid = Math.max(0, finiteNumber(document.getElementById("risk-invalid-price")?.value, 0));
        const maxRisk = Math.max(0, finiteNumber(document.getElementById("size-risk-amount")?.value, 0));
        const riskBudget = portfolio * (riskPercent / 100);
        const perUnitRisk = Math.max(0, entry - invalid);
        const position = portfolio * (allocation / 100);
        const riskCapped = perUnitRisk > 0 && entry > 0 ? (Math.min(maxRisk || riskBudget, riskBudget || maxRisk) / perUnitRisk) * entry : position;
        const capped = Math.max(0, Math.min(position, riskCapped || position));
        const units = entry > 0 ? capped / entry : 0;
        const after = portfolio > 0 ? (capped / portfolio) * 100 : 0;
        out.textContent = `Max loss ${formatPrice(Math.min(maxRisk || riskBudget, riskBudget || maxRisk || 0))} / suggested position ${formatPrice(capped)} / est. ${formatBalance(units)} ${selected.coin.symbol.toUpperCase()} / allocation after trade ${after.toFixed(1)}%. Sizing helper only. Final trade decision is external.`;
    };
    ["size-portfolio", "size-allocation", "size-risk-amount", "risk-percent", "risk-entry", "risk-invalid-price"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", updateSizing);
        document.getElementById(id)?.addEventListener("change", updateSizing);
    });
    updateSizing();
    const updateChecklistProgress = () => {
        const progress = document.getElementById("checklist-progress");
        if (!progress) return;
        const checks = [...document.querySelectorAll("[data-handoff-check]")];
        const done = checks.filter(el => el.checked).length;
        progress.textContent = `${done} / ${checks.length} checks`;
    };
    document.querySelectorAll("[data-handoff-check]").forEach(el => {
        el.addEventListener("change", updateChecklistProgress);
    });
    updateChecklistProgress();
    document.getElementById("confirm-plan")?.addEventListener("click", () => {
        const checks = [...document.querySelectorAll("[data-handoff-check]")];
        const invalidationSet = Boolean(safeText(document.getElementById("plan-invalidation")?.value, ""));
        const positionChecked = finiteNumber(document.getElementById("plan-size")?.value) > 0;
        if (checks.every(input => input.checked) && invalidationSet && positionChecked) {
            planConfirmedAssetId = selected.coin.id;
            renderDashboard(currentDashboardModel);
        }
    });
    document.getElementById("save-plan-journal")?.addEventListener("click", () => {
        planConfirmedAssetId = selected.coin.id;
        addTrade(planTradeFromSelection(selected, portfolioValue));
        renderDashboard(currentDashboardModel);
    });
    document.getElementById("add-analysis-watch")?.addEventListener("click", () => {
        const state = guideStateFor(selected).label;
        addAnalysisWatch({
            assetId: selected.coin.id,
            symbol: selected.coin.symbol,
            name: selected.coin.name,
            signalAtWatch: state,
            reason: safeText(document.getElementById("plan-reason")?.value, swingReasonFor(selected)),
            watchedAt: new Date().toISOString()
        });
        renderDashboard(currentDashboardModel);
    });
}

function planTradeFromSelection(selected, portfolioValue = 0) {
    const state = guideStateFor(selected).label;
    return {
        symbol: selected.coin.symbol,
        name: selected.coin.name,
        entryDate: new Date().toISOString(),
        entryPrice: selected.coin.current_price,
        positionSize: Math.max(0, finiteNumber(document.getElementById("plan-size")?.value)),
        signalState: state,
        reasonEntry: safeText(document.getElementById("plan-reason")?.value, swingReasonFor(selected)),
        plannedInvalidation: safeText(document.getElementById("plan-invalidation")?.value, invalidationSentence(state)),
        agentConsensus: agentConsensusFor(selected, portfolioValue).label,
        fromZenCloud: true,
        notes: safeText(document.getElementById("plan-notes")?.value, ""),
        status: "open"
    };
}

function agentConsensusFor(item, portfolioValue = 0) {
    const state = guideStateFor(item).label;
    const liquidity = liquidityFor(item);
    const risk = riskFor(item);
    const oneHour = finiteNumber(item.coin.change1h ?? item.coin.price_change_percentage_1h_in_currency);
    const day = finiteNumber(item.coin.change24h ?? item.coin.price_change_percentage_24h);
    const volume = finiteNumber(item.coin.volume24hAud ?? item.coin.total_volume);
    const agents = [
        {
            name: "Momentum Agent",
            result: state === "Sell Risk" ? "Reject" : day > 2 && oneHour >= 0 ? "Support" : day > 0 ? "Watch" : "Reject",
            reason: `${formatPercent(day)} 24h / ${formatPercent(oneHour)} 1h`
        },
        {
            name: "Liquidity Agent",
            result: liquidity === "Suitable" ? "Support" : liquidity === "Caution" ? "Watch" : "Reject",
            reason: volume > 0 ? formatBig(volume) : "Insufficient Data"
        },
        {
            name: "Risk Agent",
            result: state === "Sell Risk" || risk === "High" ? "Reject" : risk === "Low" ? "Support" : "Watch",
            reason: risk
        },
        {
            name: "Portfolio Agent",
            result: portfolioValue > 0 ? "Support" : "Insufficient Data",
            reason: portfolioValue > 0 ? "Portfolio value available" : "Portfolio value unavailable"
        }
    ];
    const supportCount = agents.filter(agent => agent.result === "Support").length;
    const label = state === "Sell Risk"
        ? "Review Position / No Action"
        : supportCount >= 3 ? "High Consensus" : supportCount === 2 ? "Analyse Candidate" : supportCount === 1 ? "Watch Only" : "No Action";
    return { label, agents, supportCount };
}

function swingReasonFor(item) {
    const state = guideStateFor(item).label;
    const liquidity = liquidityFor(item);
    if (state === "Breakout") return "Positive 24hr move with 1hr confirmation.";
    if (state === "Volume Spike") return "Volume expansion with tradable liquidity.";
    if (liquidity === "Suitable") return "Momentum and liquidity are aligned.";
    return "Early positive state with controlled risk.";
}

function swingCandidateFor(items) {
    return items.find(item => {
        const coin = item.coin;
        const state = guideStateFor(item).label;
        const risk = riskFor(item);
        const liquidity = liquidityFor(item);
        const oneHour = finiteNumber(coin.price_change_percentage_1h_in_currency);
        const day = finiteNumber(coin.price_change_percentage_24h);
        const volume = finiteNumber(coin.total_volume);
        return day > 0
            && oneHour > -1
            && volume >= 25000000
            && Number.isFinite(coin.current_price)
            && coin.current_price > 0
            && risk !== "High"
            && liquidity !== "Avoid"
            && ["Breakout", "Watch", "Volume Spike"].includes(state);
    }) || null;
}

function renderBestSwingMover(items) {
    const el = document.getElementById("best-swing-mover");
    if (!el) return;
    const candidate = swingCandidateFor(items);
    if (!candidate) {
        el.innerHTML = `
            <div class="swing-header">
                <span>Best Swing Mover</span>
                <span class="badge wait">No Action</span>
            </div>
            <div class="swing-empty">No clear swing candidate right now.</div>
        `;
        return;
    }
    const state = guideStateFor(candidate);
    const risk = riskFor(candidate);
    const liquidity = liquidityFor(candidate);
    el.innerHTML = `
        <div class="swing-header">
            <span>Best Swing Mover</span>
            <button class="table-action" type="button" data-asset-id="${candidate.coin.id}">Analyse</button>
        </div>
        <div class="swing-body">
            <div class="swing-asset">${coinCell(candidate.coin)} <span class="badge ${state.klass}">${state.label}</span></div>
            <div class="swing-metrics">
                <span><small>Swing score</small><strong>${candidate.decision.score}</strong></span>
                <span><small>1hr</small><strong class="${percentClass(candidate.coin.price_change_percentage_1h_in_currency)}">${formatPercent(candidate.coin.price_change_percentage_1h_in_currency)}</strong></span>
                <span><small>24hr</small><strong class="${percentClass(candidate.coin.price_change_percentage_24h)}">${formatPercent(candidate.coin.price_change_percentage_24h)}</strong></span>
                <span><small>Liquidity</small><strong>${liquidity}</strong></span>
                <span><small>Risk</small><strong>${risk}</strong></span>
            </div>
            <p>${swingReasonFor(candidate)}</p>
        </div>
    `;
}

function exitRiskCandidateFor(items, holdingRows) {
    const held = holdingRows.filter(row => row.holding.balance > 0);
    const candidates = held.map(row => {
        const item = items.find(asset => asset.coin.symbol.toUpperCase() === row.holding.symbol || asset.coin.name.toLowerCase() === row.holding.name.toLowerCase());
        return item ? { item, holding: row.holding } : null;
    }).filter(Boolean);
    const risky = candidates.filter(({ item }) => {
        const state = guideStateFor(item).label;
        return state === "Sell Risk" || riskFor(item) === "High" || finiteNumber(item.coin.price_change_percentage_1h_in_currency) < -1 || finiteNumber(item.coin.price_change_percentage_24h) < 0;
    });
    return risky.sort((a, b) => {
        const stateWeight = item => guideStateFor(item).label === "Sell Risk" ? 3 : riskFor(item) === "High" ? 2 : 1;
        return stateWeight(b.item) - stateWeight(a.item) || Math.abs(b.item.coin.price_change_percentage_24h) - Math.abs(a.item.coin.price_change_percentage_24h);
    })[0] || null;
}

function renderHighestExitRisk(items, holdingRows) {
    const el = document.getElementById("highest-exit-risk");
    if (!el) return;
    const candidate = exitRiskCandidateFor(items, holdingRows);
    if (!candidate) {
        el.innerHTML = `
            <div class="swing-header">
                <span>Highest Exit Risk</span>
                <span class="badge wait">No Action</span>
            </div>
            <div class="swing-empty">No held asset is currently showing elevated exit risk.</div>
        `;
        return;
    }
    const { item } = candidate;
    const state = guideStateFor(item);
    const reason = state.label === "Sell Risk" ? "Risk state triggered; review position." : "Held asset structure has weakened.";
    el.innerHTML = `
        <div class="swing-header">
            <span>Highest Exit Risk</span>
            <button class="table-action" type="button" data-asset-id="${item.coin.id}">Review Position</button>
        </div>
        <div class="swing-body">
            <div class="swing-asset">${coinCell(item.coin)} <span class="badge ${state.klass}">${state.label}</span></div>
            <div class="swing-metrics">
                <span><small>1hr</small><strong class="${percentClass(item.coin.price_change_percentage_1h_in_currency)}">${formatPercent(item.coin.price_change_percentage_1h_in_currency)}</strong></span>
                <span><small>24hr</small><strong class="${percentClass(item.coin.price_change_percentage_24h)}">${formatPercent(item.coin.price_change_percentage_24h)}</strong></span>
                <span><small>Risk</small><strong>${riskFor(item)}</strong></span>
            </div>
            <p>${reason}</p>
        </div>
    `;
}

function renderAnalysisWatchlist(items) {
    const body = document.getElementById("analysis-watchlist-body");
    if (!body) return;
    const rows = analysisWatchlist.map(normalizeWatchItem);
    body.innerHTML = rows.length ? rows.map(row => {
        const item = items.find(asset => asset.coin.id === row.assetId || asset.coin.symbol.toUpperCase() === row.symbol);
        const current = item ? guideStateFor(item).label : "No Action";
        const order = { "Sell Risk": 0, "No Action": 1, Watch: 2, "Volume Spike": 3, Breakout: 4 };
        const delta = (order[current] || 0) > (order[row.signalAtWatch] || 0)
            ? "Improved"
            : (order[current] || 0) < (order[row.signalAtWatch] || 0) ? "Weakened" : "Neutral";
        return `
            <tr>
                <td>${escapeHtml(row.symbol)} / ${escapeHtml(row.name)}</td>
                <td>${escapeHtml(row.reason)}</td>
                <td>${escapeHtml(row.signalAtWatch)}</td>
                <td>${escapeHtml(current)}</td>
                <td>${delta}</td>
                <td><button class="table-action danger-action" type="button" data-remove-watch="${escapeHtml(row.id)}">Remove</button></td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="6" class="loading-cell">No watched assets yet.</td></tr>`;
    body.querySelectorAll("[data-remove-watch]").forEach(button => {
        button.addEventListener("click", event => {
            removeAnalysisWatch(event.currentTarget.dataset.removeWatch);
            renderDashboard(currentDashboardModel);
        });
    });
}

function renderSignalHistory() {
    const body = document.getElementById("signal-history-body");
    if (!body) return;
    const rows = signalHistory.slice(0, 12);
    body.innerHTML = rows.length ? rows.map(row => `
        <tr>
            <td>${escapeHtml(row.symbol || "")}</td>
            <td>${escapeHtml(row.previousState || "Unknown")} -> ${escapeHtml(row.currentState || "Unknown")}</td>
            <td class="num">${Number.isFinite(Number(row.currentScore)) ? Number(row.currentScore) : "Unknown"}</td>
            <td>${formatTimestamp(row.timestamp)}</td>
        </tr>
    `).join("") : `<tr><td colspan="4" class="loading-cell">No signal transitions recorded yet.</td></tr>`;
}

function renderSessionChecklist() {
    const el = document.getElementById("session-checklist");
    if (!el) return;
    el.innerHTML = `
        ${sessionChecklist.map((item, index) => `
            <label class="check-row">
                <input type="checkbox" data-check-index="${index}" ${item.checked ? "checked" : ""}>
                <span>${escapeHtml(item.label)}</span>
            </label>
        `).join("")}
        <button class="table-action" type="button" id="reset-checklist">Reset Checklist</button>
    `;
    el.querySelectorAll("[data-check-index]").forEach(input => {
        input.addEventListener("change", event => {
            sessionChecklist[Number(event.currentTarget.dataset.checkIndex)].checked = event.currentTarget.checked;
            saveChecklist();
        });
    });
    document.getElementById("reset-checklist")?.addEventListener("click", () => {
        sessionChecklist = SESSION_CHECKLIST_ITEMS.map(label => ({ label, checked: false }));
        saveChecklist();
        renderSessionChecklist();
    });
}

function performanceMetrics(trades = tradeJournal.map(normalizeTrade)) {
    const closed = trades.filter(trade => trade.status === "closed" && Number.isFinite(trade.resultAud));
    const open = trades.filter(trade => trade.status !== "closed");
    if (!closed.length) return { trades, open, closed, enough: false };
    const wins = closed.filter(trade => trade.resultAud > 0);
    const gains = wins.map(trade => trade.resultPercent || 0);
    const losses = closed.filter(trade => trade.resultAud < 0).map(trade => trade.resultPercent || 0);
    const best = [...closed].sort((a, b) => b.resultAud - a.resultAud)[0];
    const worst = [...closed].sort((a, b) => a.resultAud - b.resultAud)[0];
    const net = closed.reduce((total, trade) => total + trade.resultAud, 0);
    const mostTraded = Object.entries(trades.reduce((acc, trade) => {
        acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
        return acc;
    }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "Not enough data";
    const bySignal = Object.entries(closed.reduce((acc, trade) => {
        acc[trade.signalState] = acc[trade.signalState] || [];
        acc[trade.signalState].push(trade.resultAud);
        return acc;
    }, {})).map(([signal, values]) => ({ signal, avg: values.reduce((a, b) => a + b, 0) / values.length }));
    const byConsensus = Object.entries(closed.reduce((acc, trade) => {
        const key = safeText(trade.agentConsensus, "Not recorded");
        acc[key] = acc[key] || [];
        acc[key].push(trade.resultAud);
        return acc;
    }, {})).map(([consensus, values]) => ({ consensus, avg: values.reduce((a, b) => a + b, 0) / values.length, count: values.length }));
    const consensusCounts = Object.entries(trades.reduce((acc, trade) => {
        const key = safeText(trade.agentConsensus, "Not recorded");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {})).map(([label, count]) => `${label}: ${count}`).join(" / ") || "Not enough data";
    return {
        trades, open, closed, enough: true,
        winRate: (wins.length / closed.length) * 100,
        avgGain: gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0,
        avgLoss: losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
        best,
        worst,
        net,
        mostTraded,
        bestSignal: bySignal.sort((a, b) => b.avg - a.avg)[0]?.signal || "Not enough data",
        worstSignal: bySignal.sort((a, b) => a.avg - b.avg)[0]?.signal || "Not enough data",
        consensusCounts,
        bestConsensus: byConsensus.sort((a, b) => b.avg - a.avg)[0]?.consensus || "Not enough data",
        worstConsensus: byConsensus.sort((a, b) => a.avg - b.avg)[0]?.consensus || "Not enough data"
    };
}

function renderPerformanceSummary(targetId, trades = tradeJournal.map(normalizeTrade)) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const metrics = performanceMetrics(trades);
    if (!metrics.enough) {
        el.innerHTML = `<div class="empty-analysis compact-empty">Not enough closed trades yet.</div>`;
        return;
    }
    const cells = [
        ["Trades", metrics.trades.length],
        ["Open", metrics.open.length],
        ["Closed", metrics.closed.length],
        ["Win rate", `${metrics.winRate.toFixed(1)}%`],
        ["Avg gain", `${metrics.avgGain.toFixed(2)}%`],
        ["Avg loss", `${metrics.avgLoss.toFixed(2)}%`],
        ["Best", displayMoneyText(metrics.best.resultAud, formatSignedMoney)],
        ["Worst", displayMoneyText(metrics.worst.resultAud, formatSignedMoney)],
        ["Net AUD", displayMoneyText(metrics.net, formatSignedMoney)],
        ["Most traded", metrics.mostTraded],
        ["Best signal", metrics.bestSignal],
        ["Worst signal", metrics.worstSignal],
        ["Consensus", metrics.consensusCounts],
        ["Best consensus", metrics.bestConsensus],
        ["Worst consensus", metrics.worstConsensus]
    ];
    el.innerHTML = cells.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function guideStateFor(item) {
    if (item.state.trendState === "trend_breakout") return { label: "Breakout", klass: "strong" };
    if (item.state.trendState === "trend_downside") return { label: "Sell Risk", klass: "sell" };
    if (item.state.trendState === "trend_positive") return { label: "Watch", klass: "watch" };
    if (item.state.alertTrigger === "volume_spike") return { label: "Volume Spike", klass: "volume" };
    return { label: "No Action", klass: "wait" };
}

function confirmationFor(item, stateLabel) {
    const oneHour = finiteNumber(item.coin.price_change_percentage_1h_in_currency);
    const day = finiteNumber(item.coin.price_change_percentage_24h);
    const volume = finiteNumber(item.coin.total_volume);
    let score = 0;
    if (oneHour > 0) score += 1;
    if (day > 2) score += 1;
    if (volume > 1000000000) score += 1;
    if (stateLabel === "Breakout") score += 1;
    if (stateLabel === "Sell Risk") score += 1;
    if (score >= 3) return "Strong";
    if (score >= 2) return "Medium";
    return "Weak";
}

function riskFor(item) {
    const move = Math.abs(finiteNumber(item.coin.price_change_percentage_24h));
    const hour = Math.abs(finiteNumber(item.coin.price_change_percentage_1h_in_currency));
    if (move >= 8 || hour >= 4) return "High";
    if (move >= 3 || hour >= 1.5) return "Medium";
    return "Low";
}

function liquidityFor(item) {
    const volume = finiteNumber(item.coin.total_volume);
    if (volume >= 100000000) return "Suitable";
    if (volume >= 25000000) return "Caution";
    return "Avoid";
}

function signalAgeFor(stateLabel) {
    return stateLabel === "No Action" ? "Unknown" : "Fresh";
}

function invalidationFor(stateLabel) {
    const invalidations = {
        Breakout: "1hr momentum turns negative",
        Watch: "24hr move falls below 2%",
        "Sell Risk": "Risk threshold clears",
        "Volume Spike": "Volume drops below threshold",
        "No Action": "New threshold state appears"
    };
    return invalidations[stateLabel] || "Unknown";
}

function invalidationSentence(stateLabel) {
    const invalidations = {
        Breakout: "Invalid if 1hr momentum turns negative.",
        Watch: "Invalid if 24hr move falls below 2%.",
        "Sell Risk": "Risk state triggered; review position.",
        "Volume Spike": "Invalid if volume drops below threshold.",
        "No Action": "Review if a new threshold state appears."
    };
    return invalidations[stateLabel] || "Review if risk state triggered.";
}

function recordSignalHistory(assets) {
    if (!Array.isArray(assets) || !assets.length) return;
    const previousRows = loadCollection(SIGNAL_HISTORY_STORAGE_KEY);
    const latestByAsset = new Map();
    previousRows.forEach(row => {
        if (!latestByAsset.has(row.assetId)) latestByAsset.set(row.assetId, row);
    });
    const nextRows = [...previousRows];
    assets.forEach(item => {
        const current = guideStateFor(item).label;
        const previous = latestByAsset.get(item.coin.id);
        if (!previous) {
            nextRows.unshift({
                assetId: item.coin.id,
                symbol: item.coin.symbol.toUpperCase(),
                name: item.coin.name,
                previousState: "Untracked",
                currentState: current,
                previousScore: null,
                currentScore: item.decision.score,
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (previous.currentState !== current || Number(previous.currentScore) !== item.decision.score) {
            nextRows.unshift({
                assetId: item.coin.id,
                symbol: item.coin.symbol.toUpperCase(),
                name: item.coin.name,
                previousState: previous.currentState,
                currentState: current,
                previousScore: Number(previous.currentScore),
                currentScore: item.decision.score,
                timestamp: new Date().toISOString()
            });
        }
    });
    signalHistory = saveCollection(SIGNAL_HISTORY_STORAGE_KEY, nextRows.slice(0, 80));
}

function renderTradeGuide(items) {
    const body = document.getElementById("trade-guide-body");
    if (!body) return;
    body.innerHTML = items.slice(0, 10).map((item, index) => {
        const state = guideStateFor(item);
        const supported = coinspotStatus(item.coin);
        const analysed = item.coin.id === selectedAssetId;
        const fallbackLocked = Boolean(dataConfidence.isFallback);
        const handoffUrl = analysed && planConfirmedAssetId === item.coin.id && !fallbackLocked ? coinspotUrl(item.coin) : null;
        const action = handoffUrl
            ? `<a class="table-action" href="${handoffUrl}" target="_blank" rel="noopener noreferrer">CoinSpot</a>`
            : fallbackLocked && analysed
                ? `<span class="watch-only">Review only</span>`
            : supported === "Supported" && !analysed
                ? `<button class="table-action" type="button" data-asset-id="${item.coin.id}">Analyse</button>`
                : analysed && supported === "Supported" ? "Manual only" : "Watch only";
        return `
            <tr>
                <td class="num">${index + 1}</td>
                <td>${coinCell(item.coin)}</td>
                <td><span class="badge ${state.klass}">${state.label}</span></td>
                <td>${confirmationFor(item, state.label)}</td>
                <td>${riskFor(item)}</td>
                <td>${liquidityFor(item)}</td>
                <td>${signalAgeFor(state.label)}</td>
                <td>${invalidationFor(state.label)}</td>
                <td>${supported}</td>
                <td>${action}</td>
            </tr>
        `;
    }).join("");
}

function renderHoldingsAllocation(holdingRows, portfolioValue) {
    const pie = document.getElementById("holdings-pie");
    const body = document.getElementById("holdings-body");
    if (!pie || !body) return;

    const activeRows = holdingRows.filter(row => row.holding.balance > 0);
    const valuedRows = activeRows.filter(row => row.value !== null);
    const lead = valuedRows.sort((a, b) => b.value - a.value)[0] || activeRows[0];
    const leadPercent = lead && portfolioValue > 0 && lead.value !== null
        ? Math.round((lead.value / portfolioValue) * 100)
        : activeRows.length === 1 ? 100 : 0;
    pie.innerHTML = lead ? `${lead.holding.symbol}<br>${hideValues ? "••••" : `${leadPercent}%`}` : "0%";

    if (!activeRows.length) {
        body.innerHTML = `<tr><td colspan="3" class="loading-cell">No active holdings.</td></tr>`;
        return;
    }

    body.innerHTML = activeRows.map(row => {
        const allocation = row.value !== null && portfolioValue > 0
            ? `${((row.value / portfolioValue) * 100).toFixed(1)}%`
            : "Price unavailable";
        return `
            <tr>
                <td>${coinCell(row.displayCoin)}</td>
                <td class="num">${hideValues ? maskHidden() : allocation}</td>
                <td class="num">${row.value === null ? "Price unavailable" : displayPrice(row.value)}</td>
            </tr>
        `;
    }).join("");
}

function renderHoldingsManager(markets, holdingRows) {
    const body = document.getElementById("manage-holdings-body");
    if (!body) return;

    body.innerHTML = holdingRows.length ? holdingRows.map(row => `
        <tr>
            <td>${coinCell(row.displayCoin)}</td>
            <td class="num">${hideValues ? `<span class="masked-value">${maskUnits()}</span>` : `<input class="inline-balance" type="number" min="0" step="any" value="${row.holding.balance}" data-balance-symbol="${escapeHtml(row.holding.symbol)}">`}</td>
            <td class="num">${hideValues ? `<span class="masked-value">${maskMoney()}</span>` : `<input class="inline-balance" type="number" min="0" step="any" value="${row.holding.avgEntryPrice || ""}" data-entry-symbol="${escapeHtml(row.holding.symbol)}" placeholder="Entry not set">`}</td>
            <td class="num">${row.market ? formatPrice(row.market.current_price) : "Price unavailable"}</td>
            <td class="num ${unrealizedFor(row).aud > 0 ? "positive" : unrealizedFor(row).aud < 0 ? "negative" : "neutral"}">${hideValues ? maskMoney() : unrealizedFor(row).label}</td>
            <td><input class="inline-note" type="text" value="${escapeHtml(row.holding.note)}" data-note-symbol="${escapeHtml(row.holding.symbol)}" placeholder="None"></td>
            <td>${holdingDuration(row.holding.updatedAt)}</td>
            <td>${formatTimestamp(row.holding.updatedAt)}</td>
            <td>
                <button class="table-action" type="button" data-save-holding="${escapeHtml(row.holding.symbol)}" ${hideValues ? "disabled" : ""}>Save</button>
                <button class="table-action danger-action" type="button" data-remove-holding="${escapeHtml(row.holding.symbol)}">Remove</button>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="8" class="loading-cell">No manual holdings saved.</td></tr>`;

    body.querySelectorAll("[data-save-holding]").forEach(button => {
        button.addEventListener("click", event => {
            const symbol = event.currentTarget.dataset.saveHolding;
            const balanceInput = body.querySelector(`[data-balance-symbol="${symbol}"]`);
            const entryInput = body.querySelector(`[data-entry-symbol="${symbol}"]`);
            const noteInput = body.querySelector(`[data-note-symbol="${symbol}"]`);
            updateHoldingBalance(symbol, balanceInput?.value, noteInput?.value, entryInput?.value);
        });
    });

    body.querySelectorAll("[data-remove-holding]").forEach(button => {
        button.addEventListener("click", event => {
            removeHolding(event.currentTarget.dataset.removeHolding);
        });
    });
}

function rerenderDashboard() {
    if (currentDashboardModel) renderDashboard(currentDashboardModel);
}

function upsertHolding({ symbol, name, balance, note, avgEntryPrice }) {
    const cleanSymbol = safeText(symbol, "").toUpperCase();
    const cleanName = safeText(name, cleanSymbol);
    const cleanBalance = Number(balance);
    const cleanEntry = avgEntryPrice === "" || avgEntryPrice === null || typeof avgEntryPrice === "undefined"
        ? null
        : Number(avgEntryPrice);
    if (!cleanSymbol) {
        setHoldingsMessage("Enter a coin symbol.", true);
        return;
    }
    if (!/^[A-Z0-9.-]+$/.test(cleanSymbol)) {
        setHoldingsMessage("Symbol can use letters, numbers, dots, or hyphens.", true);
        return;
    }
    if (!Number.isFinite(cleanBalance) || cleanBalance < 0) {
        setHoldingsMessage("Balance must be a non-negative number.", true);
        return;
    }
    if (cleanEntry !== null && (!Number.isFinite(cleanEntry) || cleanEntry < 0)) {
        setHoldingsMessage("Average entry must be a non-negative number.", true);
        return;
    }

    const nextHolding = normalizeHolding({
        symbol: cleanSymbol,
        name: cleanName,
        balance: cleanBalance,
        avgEntryPrice: cleanEntry,
        note: safeText(note, ""),
        updatedAt: new Date().toISOString()
    });
    const sourceHoldings = usingDefaultHoldings || isDefaultSampleSet(manualHoldings) ? [] : manualHoldings;
    const remaining = sourceHoldings.filter(holding => holding.symbol !== cleanSymbol);
    saveHoldings([...remaining, nextHolding]);
    setHoldingsMessage(`${cleanSymbol} holding saved.`);
    rerenderDashboard();
}

function updateHoldingBalance(symbol, balance, note, avgEntryPrice) {
    const cleanSymbol = safeText(symbol, "").toUpperCase();
    const existing = manualHoldings.find(holding => holding.symbol === cleanSymbol);
    if (!existing) return;
    upsertHolding({
        ...existing,
        balance,
        note,
        avgEntryPrice
    });
}

function removeHolding(symbol) {
    const cleanSymbol = safeText(symbol, "").toUpperCase();
    saveHoldings(manualHoldings.filter(holding => holding.symbol !== cleanSymbol));
    setHoldingsMessage(`${cleanSymbol} holding removed.`);
    rerenderDashboard();
}

function resetHoldings() {
    saveHoldings(defaultHoldings());
    setHoldingsMessage("Default holdings restored.");
    rerenderDashboard();
}

function initHoldingsControls() {
    const form = document.getElementById("holdings-form");
    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();
            const formData = new FormData(form);
            upsertHolding({
                symbol: formData.get("symbol"),
                name: formData.get("name"),
                balance: formData.get("balance"),
                avgEntryPrice: formData.get("avgEntryPrice"),
                note: formData.get("note")
            });
            if (!document.getElementById("holdings-message")?.classList.contains("error")) {
                form.reset();
            }
        });
    }

    const resetButton = document.getElementById("reset-holdings");
    if (resetButton) {
        resetButton.addEventListener("click", resetHoldings);
    }
}

function initSecondaryTabs() {
    const tabs = document.getElementById("secondary-tabs");
    if (!tabs) return;
    tabs.querySelectorAll("[data-tab-target]").forEach(button => {
        button.addEventListener("click", event => {
            const targetId = event.currentTarget.dataset.tabTarget;
            tabs.querySelectorAll("[data-tab-target]").forEach(tab => {
                tab.classList.toggle("active", tab === event.currentTarget);
            });
            tabs.querySelectorAll(".tab-panel").forEach(panel => {
                panel.classList.toggle("active", panel.id === targetId);
            });
        });
    });
}

function renderTodayMovers(markets) {
    const sorted = [...markets].filter(coin => Number.isFinite(coin.price_change_percentage_24h));
    const up = sorted.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5);
    const down = [...sorted].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 5);
    const row = coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_24h)}">${formatPercent(coin.price_change_percentage_24h)}</td>
        </tr>
    `;
    const upBody = document.getElementById("today-up-body");
    const downBody = document.getElementById("today-down-body");
    if (upBody) upBody.innerHTML = up.map(row).join("");
    if (downBody) downBody.innerHTML = down.map(row).join("");
}

function tile(coin) {
    const safeCoin = normalizeMarket(coin);
    return `
        <span class="coin-tile">
            ${safeCoin.image ? `<img class="coin-icon" src="${safeCoin.image}" alt="">` : `<span class="coin-icon"></span>`}
            <span>${safeCoin.symbol.toUpperCase()}</span>
        </span>
    `;
}

function marketStateFor(coin, volumeThreshold) {
    const oneHour = Number(coin.price_change_percentage_1h_in_currency) || 0;
    const day = Number(coin.price_change_percentage_24h) || 0;
    const volume = Number(coin.total_volume) || 0;
    const absoluteMove = Math.abs(day);
    const momentumScore = Math.round((day * 12) + (oneHour * 30) + Math.min(volume / Math.max(volumeThreshold, 1), 2) * 10);
    const trendState = day >= 5 && oneHour > 0
        ? "trend_breakout"
        : day <= -3
            ? "trend_downside"
            : day >= 2
                ? "trend_positive"
                : day <= -1
                    ? "trend_softening"
                    : "trend_neutral";
    const volatilityState = absoluteMove >= 5
        ? "volatility_high"
        : absoluteMove >= 2
            ? "volatility_medium"
            : "volatility_low";
    const alertTrigger = trendState === "trend_breakout"
        ? "breakout_event"
        : trendState === "trend_downside"
            ? "risk_threshold_breach"
            : volume >= volumeThreshold
                ? "volume_spike"
                : "none";

    return { trendState, momentumScore, volatilityState, alertTrigger };
}

function decisionForState(state) {
    if (state.trendState === "trend_breakout") return { label: "Breakout", klass: "strong", score: state.momentumScore };
    if (state.trendState === "trend_downside") return { label: "Sell Risk", klass: "sell", score: state.momentumScore };
    if (state.trendState === "trend_positive") return { label: "Watch", klass: "watch", score: state.momentumScore };
    return { label: "Watch", klass: "wait", score: state.momentumScore };
}

function eventForState(item) {
    const eventMap = {
        breakout_event: { type: "Breakout Event", klass: "strong", value: item.coin.price_change_percentage_24h, rule: "24hr above 5% with positive 1hr", triggerState: "breakout_event" },
        risk_threshold_breach: { type: "Sell Risk", klass: "risk", value: item.coin.price_change_percentage_24h, rule: "24hr below -3%", triggerState: "risk_threshold_breach" },
        volume_spike: { type: "Volume Spike", klass: "volume", value: item.coin.total_volume, rule: "Top live AUD volume band", triggerState: "volume_spike" }
    };
    if (item.state.trendState === "trend_positive") {
        return { type: "Watch Event", klass: "watch", value: item.coin.price_change_percentage_24h, rule: "24hr above 2%", triggerState: "trend_positive" };
    }
    return eventMap[item.state.alertTrigger] || null;
}

function buildDecisionPipeline(markets) {
    const safeMarkets = normalizeMarkets(markets);
    const volumeThreshold = [...safeMarkets]
        .map(coin => Number(coin.total_volume) || 0)
        .sort((a, b) => b - a)[4] || 0;
    const assets = safeMarkets.map(coin => {
        const state = marketStateFor(coin, volumeThreshold);
        return { coin, state, decision: decisionForState(state) };
    });
    const rankedAssets = [...assets].sort((a, b) => b.decision.score - a.decision.score);
    const alertEvents = assets
        .map(item => ({ item, event: eventForState(item) }))
        .filter(row => row.event)
        .sort((a, b) => {
            const eventOrder = { "Sell Risk": 0, "Breakout Event": 1, "Watch Event": 2, "Volume Spike": 3 };
            return eventOrder[a.event.type] - eventOrder[b.event.type] || Math.abs(b.event.value) - Math.abs(a.event.value);
        });

    return { markets: safeMarkets, assets, rankedAssets, alertEvents, dataConfidence: { ...dataConfidence } };
}

function observationFor(item) {
    const signalMap = {
        trend_breakout: { label: "Breakout", klass: "strong", note: "24hr breakout threshold met with positive 1hr confirmation." },
        trend_positive: { label: "Watch", klass: "watch", note: "24hr watch threshold met." },
        trend_downside: { label: "Sell Risk", klass: "sell", note: "24hr downside threshold met." },
        trend_softening: { label: "Softening", klass: "wait", note: "24hr change is below neutral band." },
        trend_neutral: { label: "Neutral", klass: "wait", note: "No threshold state transition." }
    };
    if (item.state.alertTrigger === "volume_spike" && item.state.trendState === "trend_neutral") {
        return { label: "Volume Spike", klass: "volume", note: "Asset is inside the top live AUD volume band." };
    }
    return signalMap[item.state.trendState] || signalMap.trend_neutral;
}

function renderLogs(model) {
    const logsBody = document.getElementById("logs-body");
    if (!logsBody) return;
    const systemRows = model.dataConfidence?.isFallback ? `
            <tr>
                <td>${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Brisbane" })}</td>
                <td>SYS</td>
                <td class="num">-</td>
                <td class="num">-</td>
                <td class="num">-</td>
                <td><span class="badge wait">Fallback Snapshot</span></td>
                <td>Live API unavailable. Rendering fallback snapshot. Reason: ${escapeHtml(model.dataConfidence.failureReason)}.</td>
            </tr>
    ` : "";
    const rows = model.assets.slice(0, 16).map(item => {
        const observation = observationFor(item);
        return `
            <tr>
                <td>${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Brisbane" })}</td>
                <td>${coinCell(item.coin)}</td>
                <td class="num">${formatPrice(item.coin.current_price)}</td>
                <td class="num ${percentClass(item.coin.price_change_percentage_1h_in_currency)}">${formatPercent(item.coin.price_change_percentage_1h_in_currency)}</td>
                <td class="num ${percentClass(item.coin.price_change_percentage_24h)}">${formatPercent(item.coin.price_change_percentage_24h)}</td>
                <td><span class="badge ${observation.klass}">${observation.label}</span></td>
                <td>${observation.note}</td>
            </tr>
        `;
    }).join("");
    logsBody.innerHTML = systemRows + rows;

    const { markets } = model;
    const watchlist = WATCHLIST_IDS.map(id => byId(markets, id)).filter(Boolean);
    const watchlistBody = document.getElementById("logs-watchlist-body");
    if (!watchlistBody) return;
    watchlistBody.innerHTML = watchlist.map(coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num">${formatPrice(sellPrice(coin.current_price))}</td>
            <td class="num">${formatBig(coin.total_volume)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_24h)}">${formatPercent(coin.price_change_percentage_24h)}</td>
        </tr>
    `).join("");
}

function renderAlerts(model) {
    const alertsBody = document.getElementById("alerts-body");
    if (!alertsBody) return;
    const rows = model.alertEvents.slice(0, 18).map(({ item, event }) => `
            <tr>
                <td><span class="badge ${event.klass}">${event.type}</span></td>
                <td>${coinCell(item.coin)}</td>
                <td><span class="state-token">${event.triggerState}</span></td>
                <td class="num">${event.type === "Volume Spike" ? formatBig(event.value) : formatPercent(event.value)}</td>
                <td class="num">${formatPrice(item.coin.current_price)}</td>
                <td>${event.rule}</td>
            </tr>
    `).join("");
    alertsBody.innerHTML = rows || `<tr><td colspan="6" class="loading-cell">No threshold events in the current market state.</td></tr>`;
}

function localDateKey(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return formatDateTimeLocal(new Date()).slice(0, 10);
    return formatDateTimeLocal(date).slice(0, 10);
}

function recordDateKey(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return formatDateTimeLocal(date).slice(0, 10);
}

function daysBetween(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
    return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
}

function average(values) {
    const clean = values.filter(Number.isFinite);
    return clean.length ? clean.reduce((total, value) => total + value, 0) / clean.length : 0;
}

function mostCommon(values, fallback = "Not enough data") {
    const counts = values
        .map(value => safeText(value, ""))
        .filter(Boolean)
        .reduce((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function reportMetric(label, value) {
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function assetStateForReport(model, holding) {
    const symbol = safeText(holding.symbol, "").toLowerCase();
    const name = safeText(holding.name, "").toLowerCase();
    const item = model.assets.find(row => row.coin.symbol.toLowerCase() === symbol)
        || model.assets.find(row => row.coin.id.toLowerCase() === symbol || row.coin.name.toLowerCase() === name)
        || null;
    return item ? { item, state: guideStateFor(item).label, risk: riskFor(item) } : { item: null, state: "No Action", risk: "Unknown" };
}

function exitRiskForReport(stateRow, valuation) {
    const item = stateRow.item;
    if (!item || !valuation.market) return "Price unavailable";
    const oneHour = finiteNumber(item.coin.price_change_percentage_1h_in_currency);
    const day = finiteNumber(item.coin.price_change_percentage_24h);
    if (stateRow.state === "Sell Risk" || stateRow.risk === "High" || oneHour < -1 || day < 0) return "Review Position";
    return "No elevated exit risk";
}

function renderDailyReport(trades) {
    const summary = document.getElementById("daily-report-summary");
    const note = document.getElementById("daily-report-note");
    if (!summary || !note) return;
    const selectedDate = document.getElementById("report-date")?.value || localDateKey(new Date());
    const opened = trades.filter(trade => recordDateKey(trade.entryDate) === selectedDate);
    const closedToday = trades.filter(trade => trade.status === "closed" && recordDateKey(trade.exitDate) === selectedDate);
    const closedWithResults = closedToday.filter(trade => Number.isFinite(trade.resultAud));
    const best = closedWithResults.length ? [...closedWithResults].sort((a, b) => b.resultAud - a.resultAud)[0] : null;
    const worst = closedWithResults.length ? [...closedWithResults].sort((a, b) => a.resultAud - b.resultAud)[0] : null;
    const net = closedWithResults.reduce((total, trade) => total + trade.resultAud, 0);
    const openPositions = trades.filter(trade => trade.status !== "closed").length;
    const closedPositions = trades.filter(trade => trade.status === "closed").length;
    summary.innerHTML = [
        ["Date", selectedDate],
        ["Trades opened", opened.length],
        ["Trades closed", closedToday.length],
        ["Open positions", openPositions],
        ["Closed positions", closedPositions],
        ["Best result", best ? displayMoneyText(best.resultAud, formatSignedMoney) : "Not recorded"],
        ["Worst result", worst ? displayMoneyText(worst.resultAud, formatSignedMoney) : "Not recorded"],
        ["Net AUD result", displayMoneyText(net, formatSignedMoney)]
    ].map(([label, value]) => reportMetric(label, value)).join("");
    note.textContent = opened.length || closedToday.length
        ? "Daily notes: review entries, exits, and whether the plan was followed."
        : "No trades logged for this day.";
}

function renderWeeklyReport(trades = sharedJournalTrades()) {
    const el = document.getElementById("weekly-report-summary");
    if (!el) return;
    const metrics = performanceMetrics(trades);
    if (!metrics.enough) {
        el.innerHTML = `<div class="empty-analysis compact-empty">Not enough closed trades yet.</div>`;
        return;
    }
    el.innerHTML = [
        ["Total trades", metrics.trades.length],
        ["Crypto records", metrics.trades.filter(trade => trade.assetClass === CRYPTO_ASSET_CLASS).length],
        ["Stock records", metrics.trades.filter(trade => trade.assetClass === STOCK_ASSET_CLASS).length],
        ["Open trades", metrics.open.length],
        ["Closed trades", metrics.closed.length],
        ["Win rate", `${metrics.winRate.toFixed(1)}%`],
        ["Average gain", `${metrics.avgGain.toFixed(2)}%`],
        ["Average loss", `${metrics.avgLoss.toFixed(2)}%`],
        ["Net AUD result", displayMoneyText(metrics.net, formatSignedMoney)],
        ["Best signal type", metrics.bestSignal],
        ["Worst signal type", metrics.worstSignal],
        ["Most traded asset", metrics.mostTraded],
        ["Trades by consensus", metrics.consensusCounts],
        ["Best consensus state", metrics.bestConsensus],
        ["Worst consensus state", metrics.worstConsensus]
    ].map(([label, value]) => reportMetric(label, value)).join("");
}

function renderTradeReviewReport(trades) {
    const body = document.getElementById("trade-review-body");
    if (!body) return;
    const closed = trades.filter(trade => trade.status === "closed");
    const mistakeOptions = ["No plan", "Entered too late", "Exited too early", "Ignored invalidation", "Oversized position", "Chased movement", "Other"];
    body.innerHTML = closed.length ? closed.map(trade => `
        <tr>
            <td>${assetClassBadge(trade.assetClass)}</td>
            <td>${escapeHtml(trade.symbol)} / ${escapeHtml(trade.name)}</td>
            <td>${escapeHtml(trade.reasonEntry)}</td>
            <td>${escapeHtml(trade.signalState)}</td>
            <td>${escapeHtml(trade.agentConsensus)}</td>
            <td>${escapeHtml(trade.plannedInvalidation)}</td>
            <td>${escapeHtml(trade.exitReason || "Manual close")}</td>
            <td class="num ${trade.resultAud > 0 ? "positive" : trade.resultAud < 0 ? "negative" : "neutral"}">${trade.resultAud === null ? "Not recorded" : displayMoneyText(trade.resultAud, formatSignedMoney)}</td>
            <td class="num ${trade.resultPercent > 0 ? "positive" : trade.resultPercent < 0 ? "negative" : "neutral"}">${trade.resultPercent === null ? "Not recorded" : displayPercentValue(trade.resultPercent)}</td>
            <td>
                <label class="rule-toggle">
                    <input type="checkbox" data-review-rule="${escapeHtml(trade.id)}" ${trade.ruleFollowed ? "checked" : ""}>
                    <span>${trade.ruleFollowed ? "Yes" : "No"}</span>
                </label>
            </td>
            <td>
                <div class="review-fields">
                    <label class="review-field">Mistake type
                        <select data-review-mistake="${escapeHtml(trade.id)}">
                            ${mistakeOptions.map(option => `<option ${trade.mistakeType === option ? "selected" : ""}>${option}</option>`).join("")}
                        </select>
                    </label>
                    <label class="review-field">Lesson learned
                        <input type="text" data-review-lesson="${escapeHtml(trade.id)}" value="${escapeHtml(trade.lessonLearned)}" placeholder="Optional">
                    </label>
                    <button class="table-action" type="button" data-save-review="${escapeHtml(trade.id)}">Save Review</button>
                </div>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="11" class="loading-cell">No closed trades to review.</td></tr>`;
    body.querySelectorAll("[data-save-review]").forEach(button => {
        button.addEventListener("click", event => {
            const id = event.currentTarget.dataset.saveReview;
            updateTrade(id, {
                ruleFollowed: Boolean(document.querySelector(`[data-review-rule="${id}"]`)?.checked),
                mistakeType: document.querySelector(`[data-review-mistake="${id}"]`)?.value || "Other",
                lessonLearned: document.querySelector(`[data-review-lesson="${id}"]`)?.value || ""
            });
            if (currentReportModel) renderReports(currentReportModel);
        });
    });
}

function renderPositionReport(model) {
    const body = document.getElementById("position-report-body");
    if (!body) return;
    const filter = currentReportAssetFilter();
    const cryptoRows = manualHoldings.map(holding => {
        const normalized = normalizeHolding(holding);
        const valuation = holdingValuation(model.markets, normalized);
        const unrealized = unrealizedFor({ holding: normalized, market: valuation.market });
        const stateRow = assetStateForReport(model, normalized);
        return { type: CRYPTO_ASSET_CLASS, holding: normalized, valuation, unrealized, stateRow };
    }).filter(row => row.holding.symbol);
    const stockRows = loadStockWorkspacePositions().filter(row => row.symbol).map(position => {
        const unrealisedAud = (position.referencePrice - position.avgEntryPrice) * position.units;
        const unrealisedPercent = position.avgEntryPrice > 0 ? ((position.referencePrice - position.avgEntryPrice) / position.avgEntryPrice) * 100 : null;
        return { type: STOCK_ASSET_CLASS, position, unrealisedAud, unrealisedPercent };
    });
    const rows = [
        ...(filter === "all" || filter === CRYPTO_ASSET_CLASS ? cryptoRows : []),
        ...(filter === "all" || filter === STOCK_ASSET_CLASS ? stockRows : [])
    ];
    body.innerHTML = rows.length ? rows.map(row => row.type === STOCK_ASSET_CLASS ? `
        <tr>
            <td>${assetClassBadge(STOCK_ASSET_CLASS)}</td>
            <td>${escapeHtml(row.position.symbol)} / ${escapeHtml(row.position.name)}</td>
            <td class="num">${displayBalance(row.position.units, row.position.symbol)}</td>
            <td class="num">${displayEntry(row.position.avgEntryPrice)}</td>
            <td class="num">${row.position.referencePrice ? displayTradeValue(row.position.referencePrice) : "Reference unavailable"}</td>
            <td class="num ${row.unrealisedAud > 0 ? "positive" : row.unrealisedAud < 0 ? "negative" : "neutral"}">${displayMoneyText(row.unrealisedAud, formatSignedMoney)}</td>
            <td class="num ${row.unrealisedPercent > 0 ? "positive" : row.unrealisedPercent < 0 ? "negative" : "neutral"}">${row.unrealisedPercent === null ? "Not recorded" : displayPercentValue(row.unrealisedPercent)}</td>
            <td>Manual stock position</td>
            <td>Stock Workspace</td>
            <td>Broker review only</td>
        </tr>
    ` : `
        <tr>
            <td>${assetClassBadge(CRYPTO_ASSET_CLASS)}</td>
            <td>${escapeHtml(row.holding.symbol)} / ${escapeHtml(row.holding.name)}</td>
            <td class="num">${displayBalance(row.holding.balance, row.holding.symbol)}</td>
            <td class="num">${displayEntry(row.holding.avgEntryPrice)}</td>
            <td class="num">${row.valuation.market ? formatPrice(row.valuation.market.current_price) : "Price unavailable"}</td>
            <td class="num ${row.unrealized.aud > 0 ? "positive" : row.unrealized.aud < 0 ? "negative" : "neutral"}">${row.unrealized.aud === null ? (hideValues ? maskMoney() : row.unrealized.label) : displayMoneyText(row.unrealized.aud, formatSignedMoney)}</td>
            <td class="num ${row.unrealized.percent > 0 ? "positive" : row.unrealized.percent < 0 ? "negative" : "neutral"}">${row.unrealized.percent === null ? (hideValues ? maskHidden() : row.unrealized.label) : displayPercentValue(row.unrealized.percent)}</td>
            <td>${holdingDuration(row.holding.updatedAt)}</td>
            <td>${escapeHtml(row.stateRow.state)}</td>
            <td>${escapeHtml(exitRiskForReport(row.stateRow, row.valuation))}</td>
        </tr>
    `).join("") : `<tr><td colspan="10" class="loading-cell">No positions recorded.</td></tr>`;
}

function renderConsensusOutcomesReport(trades) {
    const body = document.getElementById("consensus-outcomes-body");
    if (!body) return;
    const closed = trades.filter(trade => trade.status === "closed" && Number.isFinite(trade.resultAud));
    const groups = Object.values(closed.reduce((acc, trade) => {
        const key = safeText(trade.agentConsensus, "Not recorded");
        acc[key] = acc[key] || { label: key, trades: [] };
        acc[key].trades.push(trade);
        return acc;
    }, {}));
    body.innerHTML = groups.length ? groups.map(group => {
        const wins = group.trades.filter(trade => trade.resultAud > 0).length;
        const losses = group.trades.filter(trade => trade.resultAud < 0).length;
        const net = group.trades.reduce((total, trade) => total + trade.resultAud, 0);
        const mostCommonClass = mostCommon(group.trades.map(trade => assetClassLabel(trade.assetClass)), "Not enough data");
        return `
            <tr>
                <td>${escapeHtml(group.label)}</td>
                <td class="num">${group.trades.length}</td>
                <td class="num">${wins}</td>
                <td class="num">${losses}</td>
                <td class="num ${net > 0 ? "positive" : net < 0 ? "negative" : "neutral"}">${displayMoneyText(net, formatSignedMoney)}</td>
                <td>${escapeHtml(mostCommonClass)}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="6" class="loading-cell">No consensus outcomes yet.</td></tr>`;
}

function renderBehaviourReport(trades) {
    const el = document.getElementById("behaviour-report-summary");
    if (!el) return;
    const openedByDay = trades.reduce((acc, trade) => {
        const key = recordDateKey(trade.entryDate);
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const closed = trades.filter(trade => trade.status === "closed");
    const holdingDays = closed.map(trade => daysBetween(trade.entryDate, trade.exitDate)).filter(value => value !== null);
    const withoutPlan = trades.filter(trade => !safeText(trade.reasonEntry, "") || trade.reasonEntry === "Manual trade plan").length;
    const outsideSignal = trades.filter(trade => trade.signalState === "No Action").length;
    const overtradingDays = Object.values(openedByDay).filter(count => count > 3).length;
    el.innerHTML = [
        ["Trades without plan", withoutPlan],
        ["Trades outside ZenCloud signal", outsideSignal],
        ["Overtrading days", overtradingDays],
        ["Average holding time", holdingDays.length ? `${average(holdingDays).toFixed(1)} days` : "Not enough data"],
        ["Most common mistake", mostCommon(trades.map(trade => trade.mistakeType), "Not enough data")],
        ["Most common signal at entry", mostCommon(trades.map(trade => trade.signalState), "Not enough data")],
        ["Most common consensus", mostCommon(trades.map(trade => trade.agentConsensus), "Not enough data")],
        ["Crypto records", trades.filter(trade => trade.assetClass === CRYPTO_ASSET_CLASS).length],
        ["Stock records", trades.filter(trade => trade.assetClass === STOCK_ASSET_CLASS).length],
        ["Trades from ZenCloud", trades.filter(trade => trade.fromZenCloud).length]
    ].map(([label, value]) => reportMetric(label, value)).join("");
}

let currentReportModel = null;

function renderReports(model) {
    currentReportModel = model;
    const trades = filterTradesByAssetClass(sharedJournalTrades(), currentReportAssetFilter());
    renderDailyReport(trades);
    renderWeeklyReport(trades);
    renderTradeReviewReport(trades);
    renderPositionReport(model);
    renderBehaviourReport(trades);
    renderConsensusOutcomesReport(trades);
}

function initReportsControls() {
    const tabs = document.getElementById("reports-tabs");
    if (tabs) {
        tabs.querySelectorAll("[data-report-target]").forEach(button => {
            button.addEventListener("click", event => {
                const target = event.currentTarget.dataset.reportTarget;
                tabs.querySelectorAll("[data-report-target]").forEach(tab => tab.classList.toggle("active", tab === event.currentTarget));
                tabs.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === target));
            });
        });
    }
    const dateInput = document.getElementById("report-date");
    if (dateInput && !dateInput.value) dateInput.value = localDateKey(new Date());
    dateInput?.addEventListener("change", () => {
        if (currentReportModel) renderReports(currentReportModel);
    });
    document.getElementById("report-asset-filter")?.addEventListener("change", () => {
        if (currentReportModel) renderReports(currentReportModel);
    });
}

function renderJournal() {
    currentJournalModel = true;
    const allBody = document.getElementById("all-journal-body");
    const openBody = document.getElementById("open-trades-body");
    const closedBody = document.getElementById("closed-trades-body");
    if (!openBody || !closedBody) return;
    const trades = sharedJournalTrades();
    const openRows = trades.filter(trade => trade.status !== "closed");
    const closedRows = trades.filter(trade => trade.status === "closed");
    if (allBody) {
        allBody.innerHTML = trades.length ? trades.map(trade => `
            <tr>
                <td>${assetClassBadge(trade.assetClass)}</td>
                <td>${escapeHtml(trade.symbol)} / ${escapeHtml(trade.name)}</td>
                <td>${formatTimestamp(trade.entryDate)}</td>
                <td class="num">${displayTradeValue(trade.entryPrice)}</td>
                <td class="num">${displayTradeValue(trade.positionSize)}</td>
                <td>${escapeHtml(trade.signalState)}</td>
                <td>${escapeHtml(trade.agentConsensus)}</td>
                <td>${escapeHtml(trade.reasonEntry)}</td>
                <td>${escapeHtml(trade.plannedInvalidation)}</td>
                <td>${trade.exitDate ? formatTimestamp(trade.exitDate) : "Open"}</td>
                <td class="num">${trade.exitPrice === null ? "Not recorded" : displayTradeValue(trade.exitPrice)}</td>
                <td>${escapeHtml(trade.exitReason || "Not recorded")}</td>
                <td>${trade.resultAud === null ? "Not recorded" : displayMoneyText(trade.resultAud, formatSignedMoney)}</td>
                <td>${trade.ruleFollowed ? "Yes" : "No"}</td>
                <td>${trade.fromZenCloud ? "Yes" : "No"}</td>
                <td>${escapeHtml(trade.mistakeType)}</td>
                <td>${escapeHtml(trade.lessonLearned || "Not recorded")}</td>
                <td>${escapeHtml(trade.notes || "Not recorded")}</td>
            </tr>
        `).join("") : `<tr><td colspan="18" class="loading-cell">No journal records.</td></tr>`;
    }
    openBody.innerHTML = openRows.length ? openRows.map(trade => `
        <tr>
            <td>${escapeHtml(trade.id)}</td>
            <td>${assetClassBadge(trade.assetClass)}</td>
            <td>${escapeHtml(trade.symbol)} / ${escapeHtml(trade.name)}</td>
            <td>${formatTimestamp(trade.entryDate)}</td>
            <td class="num">${displayTradeValue(trade.entryPrice)}</td>
            <td class="num">${displayTradeValue(trade.positionSize)}</td>
            <td>${escapeHtml(trade.signalState)}</td>
            <td>${escapeHtml(trade.agentConsensus)}</td>
            <td>${escapeHtml(trade.plannedInvalidation)}</td>
            <td>
                ${isStockWorkspaceRecord(trade)
                    ? `<span class="watch-only">Managed in Stocks Workspace</span>`
                    : `<input class="inline-balance close-price" type="number" min="0" step="any" placeholder="Exit price" data-close-price="${escapeHtml(trade.id)}">
                        <input class="inline-note close-reason" type="text" placeholder="Exit reason" data-close-reason="${escapeHtml(trade.id)}">
                        <button class="table-action" type="button" data-close-trade="${escapeHtml(trade.id)}">Close</button>`}
            </td>
            <td>
                ${isStockWorkspaceRecord(trade)
                    ? `<span class="watch-only">Read only</span>`
                    : `<button class="table-action" type="button" data-edit-trade="${escapeHtml(trade.id)}">Edit</button>
                        <button class="table-action danger-action" type="button" data-delete-trade="${escapeHtml(trade.id)}">Delete</button>`}
            </td>
        </tr>
    `).join("") : `<tr><td colspan="11" class="loading-cell">No open trades.</td></tr>`;
    closedBody.innerHTML = closedRows.length ? closedRows.map(trade => `
        <tr>
            <td>${escapeHtml(trade.id)}</td>
            <td>${assetClassBadge(trade.assetClass)}</td>
            <td>${escapeHtml(trade.symbol)} / ${escapeHtml(trade.name)}</td>
            <td>${formatTimestamp(trade.entryDate)} @ ${displayTradeValue(trade.entryPrice)}</td>
            <td>${formatTimestamp(trade.exitDate)} @ ${trade.exitPrice === null ? "Not recorded" : displayTradeValue(trade.exitPrice)}</td>
            <td class="num ${trade.resultAud > 0 ? "positive" : trade.resultAud < 0 ? "negative" : "neutral"}">${trade.resultAud === null ? "Not recorded" : displayMoneyText(trade.resultAud, formatSignedMoney)}</td>
            <td class="num ${trade.resultPercent > 0 ? "positive" : trade.resultPercent < 0 ? "negative" : "neutral"}">${trade.resultPercent === null ? "Not recorded" : displayPercentValue(trade.resultPercent)}</td>
            <td>${escapeHtml(trade.agentConsensus)}</td>
            <td>${trade.fromZenCloud ? "Yes" : "No"}</td>
            <td>${escapeHtml(trade.exitReason || "Manual close")}</td>
            <td>
                ${isStockWorkspaceRecord(trade)
                    ? `<span class="watch-only">Read only</span>`
                    : `<button class="table-action" type="button" data-edit-trade="${escapeHtml(trade.id)}">Edit</button>
                        <button class="table-action danger-action" type="button" data-delete-trade="${escapeHtml(trade.id)}">Delete</button>`}
            </td>
        </tr>
    `).join("") : `<tr><td colspan="11" class="loading-cell">No closed trades.</td></tr>`;
    document.querySelectorAll("[data-close-trade]").forEach(button => {
        button.addEventListener("click", event => {
            const id = event.currentTarget.dataset.closeTrade;
            closeTrade(id, document.querySelector(`[data-close-price="${id}"]`)?.value, document.querySelector(`[data-close-reason="${id}"]`)?.value || "Manual close");
            renderJournal();
        });
    });
    document.querySelectorAll("[data-delete-trade]").forEach(button => {
        button.addEventListener("click", event => {
            deleteTrade(event.currentTarget.dataset.deleteTrade);
            renderJournal();
        });
    });
    document.querySelectorAll("[data-edit-trade]").forEach(button => {
        button.addEventListener("click", event => fillJournalForm(event.currentTarget.dataset.editTrade));
    });
    renderPerformanceSummary("journal-performance-summary", trades);
}

function fillJournalForm(id) {
    const trade = tradeJournal.map(normalizeTrade).find(row => row.id === id);
    if (!trade) return;
    document.getElementById("journal-id").value = trade.id;
    document.getElementById("journal-asset-class").value = trade.assetClass;
    document.getElementById("journal-symbol").value = trade.symbol;
    document.getElementById("journal-name").value = trade.name;
    document.getElementById("journal-entry-date").value = formatDateTimeLocal(trade.entryDate);
    document.getElementById("journal-entry-price").value = trade.entryPrice;
    document.getElementById("journal-position-size").value = trade.positionSize;
    document.getElementById("journal-signal").value = trade.signalState;
    document.getElementById("journal-consensus").value = trade.agentConsensus;
    document.getElementById("journal-reason").value = trade.reasonEntry;
    document.getElementById("journal-invalidation").value = trade.plannedInvalidation;
    document.getElementById("journal-exit-date").value = trade.exitDate ? formatDateTimeLocal(trade.exitDate) : "";
    document.getElementById("journal-exit-price").value = trade.exitPrice ?? "";
    document.getElementById("journal-exit-reason").value = trade.exitReason;
    document.getElementById("journal-rule-followed").value = String(trade.ruleFollowed);
    document.getElementById("journal-from-zencloud").value = String(trade.fromZenCloud);
    document.getElementById("journal-mistake-type").value = trade.mistakeType;
    document.getElementById("journal-lesson").value = trade.lessonLearned;
    document.getElementById("journal-notes").value = trade.notes;
}

function clearJournalForm() {
    const form = document.getElementById("journal-form");
    if (!form) return;
    form.reset();
    document.getElementById("journal-id").value = "";
    document.getElementById("journal-asset-class").value = CRYPTO_ASSET_CLASS;
    document.getElementById("journal-entry-date").value = formatDateTimeLocal(new Date());
    document.getElementById("journal-consensus").value = "";
    document.getElementById("journal-from-zencloud").value = "true";
    document.getElementById("journal-rule-followed").value = "false";
    document.getElementById("journal-mistake-type").value = "Other";
}

function initJournalControls() {
    migrateAssetClassTags();
    const form = document.getElementById("journal-form");
    if (!form) return;
    clearJournalForm();
    form.addEventListener("submit", event => {
        event.preventDefault();
        const data = new FormData(form);
        const id = safeText(data.get("id"), "");
        const trade = normalizeTrade({
            id: id || journalId(),
            assetClass: data.get("assetClass"),
            symbol: data.get("symbol"),
            name: data.get("name"),
            entryDate: new Date(data.get("entryDate")).toISOString(),
            entryPrice: data.get("entryPrice"),
            positionSize: data.get("positionSize"),
            signalState: data.get("signalState"),
            agentConsensus: data.get("agentConsensus"),
            reasonEntry: data.get("reasonEntry"),
            plannedInvalidation: data.get("plannedInvalidation"),
            exitDate: data.get("exitDate") ? new Date(data.get("exitDate")).toISOString() : "",
            exitPrice: data.get("exitPrice"),
            exitReason: data.get("exitReason"),
            ruleFollowed: data.get("ruleFollowed") === "true",
            fromZenCloud: data.get("fromZenCloud") !== "false",
            mistakeType: data.get("mistakeType"),
            lessonLearned: data.get("lessonLearned"),
            notes: data.get("notes"),
            status: data.get("exitDate") || data.get("exitPrice") ? "closed" : tradeJournal.find(row => row.id === id)?.status || "open"
        });
        if (!trade.symbol || trade.entryPrice < 0 || trade.positionSize < 0) {
            document.getElementById("journal-message").textContent = "Enter valid non-negative trade details.";
            document.getElementById("journal-message").classList.add("error");
            return;
        }
        if (id) updateTrade(id, trade);
        else addTrade(trade);
        document.getElementById("journal-message").textContent = "Trade saved.";
        document.getElementById("journal-message").classList.remove("error");
        clearJournalForm();
        renderJournal();
    });
    document.getElementById("journal-reset")?.addEventListener("click", clearJournalForm);
    renderJournal();
}

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
    if (unknownCount) console.warn(`ZenCloud migration: ${unknownCount} record(s) tagged "unknown" — review asset class in Journal.`);
}

async function boot() {
    migrateAssetClassTags();
    const markets = await getMarkets();
    const model = buildDecisionPipeline(markets);
    recordSignalHistory(model.assets);
    if (page === "dashboard") {
        renderDashboard(model);
        renderLogs(model);
        renderAlerts(model);
    }
    if (page === "logs") renderLogs(model);
    if (page === "alerts") renderAlerts(model);
    if (page === "reports") renderReports(model);
}

function injectSkeletonRows(bodyId, cols, count = 5) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    const widths = ["w-long", "w-med", "w-short", "w-med", "w-short", "w-med", "w-short", "w-short", "w-short", "w-short"];
    body.innerHTML = Array.from({ length: count }, () =>
        `<tr class="skeleton-row">${Array.from({ length: cols }, (_, i) =>
            `<td><span class="skeleton-cell ${widths[i] || "w-med"}"></span></td>`
        ).join("")}</tr>`
    ).join("");
}

initPortalModeControls();
initPrivacyToggle();
initMasterRuleFooter();

if (page === "dashboard") {
    injectSkeletonRows("opportunities-body", 7);
    injectSkeletonRows("trade-guide-body", 10);
    injectSkeletonRows("watchlist-body", 6);
}

boot();
if (page === "dashboard") {
    initHoldingsControls();
    initSecondaryTabs();
}
if (page === "journal") initJournalControls();
if (page === "reports") initReportsControls();
setInterval(boot, REFRESH_INTERVAL_MS);
