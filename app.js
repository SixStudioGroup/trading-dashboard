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
const FALLBACK_STATUS = "Live API unavailable - fallback snapshot";
let fallbackWarningShown = false;
let detailedFetchErrorLogged = false;

// Future backend/proxy placeholder. Keep empty for static GitHub Pages builds.
// Intended secure backend use only:
// - CoinMarketCap /v1/cryptocurrency/listings/latest for broad ranked market data
// - CoinMarketCap /v1/cryptocurrency/quotes/latest for selected symbols or IDs
// - CoinMarketCap trending/gainers/losers endpoints if supported by the backend plan
// Never call authenticated CoinMarketCap endpoints directly from browser JavaScript.
const MARKET_DATA_PROXY_URL = "";
const REFRESH_INTERVAL_MS = 60000;
const MARKET_PROVIDERS = {
    currentPublicFeed: "Current Feed",
    coinMarketCapProxy: "CoinMarketCap Proxy",
    fallbackSnapshot: "Fallback Snapshot"
};
const dataConfidence = {
    mode: "Live Data",
    provider: MARKET_PROVIDERS.currentPublicFeed,
    plannedProvider: "CoinMarketCap API via secure proxy",
    lastSuccessfulLiveFetch: "",
    lastAttemptedFetch: "",
    failureReason: "None",
    retryCount: 0,
    nextRetryTime: "next refresh",
    isFallback: false
};

const DEFAULT_HOLDINGS = [
    { symbol: "FET", name: "Artificial Superintelligence Alliance", balance: 0, note: "Default manual holding seed", updatedAt: "2026-05-22T00:00:00+10:00" }
];

const LEGACY_DEFAULT_HOLDINGS = [
    { symbol: "BTC", balance: 0.0001393, note: "Default sample holding" },
    { symbol: "LTC", balance: 0, note: "Default sample holding" },
    { symbol: "ETH", balance: 0, note: "Default sample holding" },
    { symbol: "ETC", balance: 0, note: "Default sample holding" },
    { symbol: "BNB", balance: 0, note: "Default sample holding" },
    { symbol: "TRB", balance: 0, note: "Default sample holding" }
];

const COINSPOT_SYMBOLS = {
    ADA: "https://www.coinspot.com.au/buy/ada",
    BNB: "https://www.coinspot.com.au/buy/bnb",
    BTC: "https://www.coinspot.com.au/buy/btc",
    DOGE: "https://www.coinspot.com.au/buy/doge",
    DOT: "https://www.coinspot.com.au/buy/dot",
    ETH: "https://www.coinspot.com.au/buy/eth",
    FET: "https://www.coinspot.com.au/buy/fet",
    LTC: "https://www.coinspot.com.au/buy/ltc",
    NEAR: "https://www.coinspot.com.au/buy/near",
    THETA: "https://www.coinspot.com.au/buy/theta",
    XLM: "https://www.coinspot.com.au/buy/xlm"
};

const page = document.body.dataset.page;
const HOLDINGS_STORAGE_KEY = "zencloud.manualHoldings.v1";
const TRADE_JOURNAL_STORAGE_KEY = "zencloud.tradeJournal.v1";
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

function formatBig(value) {
    if (!Number.isFinite(value)) return "$0.00";
    return compactMoney.format(value);
}

function formatPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0.00%";
    return `${numeric.toFixed(2)}%`;
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

function loadCollection(key) {
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
    return DEFAULT_HOLDINGS.map(normalizeHolding);
}

function isDefaultSampleSet(holdings) {
    if (!Array.isArray(holdings) || holdings.length !== DEFAULT_HOLDINGS.length) return false;
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
            && match.note === defaultHolding.note
            && match.balance === defaultHolding.balance;
    });
}

function loadHoldings() {
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
    const symbol = safeText(coin?.symbol, "").toUpperCase();
    return COINSPOT_SYMBOLS[symbol] || null;
}

function coinspotStatus(coin) {
    return coinspotUrl(coin) ? "Supported" : "Watch only";
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
    const exitPrice = Number(trade.exitPrice);
    const resultAud = Number(trade.resultAud);
    const resultPercent = Number(trade.resultPercent);
    return {
        id: safeText(trade.id, journalId()),
        symbol: safeText(trade.symbol, "").toUpperCase(),
        name: safeText(trade.name, safeText(trade.symbol, "").toUpperCase() || "Unknown Asset"),
        entryDate: safeText(trade.entryDate, new Date().toISOString()),
        entryPrice: Number.isFinite(entryPrice) && entryPrice >= 0 ? entryPrice : 0,
        positionSize: Number.isFinite(positionSize) && positionSize >= 0 ? positionSize : 0,
        signalState: safeText(trade.signalState, "No Action"),
        reasonEntry: safeText(trade.reasonEntry, "Manual trade plan"),
        plannedInvalidation: safeText(trade.plannedInvalidation, "Review if risk state triggered"),
        exitDate: safeText(trade.exitDate, ""),
        exitPrice: Number.isFinite(exitPrice) && exitPrice >= 0 ? exitPrice : null,
        exitReason: safeText(trade.exitReason, ""),
        resultAud: Number.isFinite(resultAud) ? resultAud : null,
        resultPercent: Number.isFinite(resultPercent) ? resultPercent : null,
        notes: safeText(trade.notes, ""),
        ruleFollowed: typeof trade.ruleFollowed === "boolean" ? trade.ruleFollowed : false,
        mistakeType: safeText(trade.mistakeType, "Other"),
        lessonLearned: safeText(trade.lessonLearned, ""),
        status: trade.status === "closed" ? "closed" : "open",
        updatedAt: safeText(trade.updatedAt, new Date().toISOString())
    };
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
        return `Fallback Snapshot · ${dataConfidence.failureReason} · Last live: ${lastLive}`;
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
            lastSuccessfulLiveFetch: dataConfidence.lastSuccessfulLiveFetch ? formatTimestamp(dataConfidence.lastSuccessfulLiveFetch) : "Not recorded",
            lastAttemptedFetch: dataConfidence.lastAttemptedFetch ? formatTimestamp(dataConfidence.lastAttemptedFetch) : "Not recorded",
            failureReason: dataConfidence.failureReason,
            retryCount: String(dataConfidence.retryCount),
            nextRetryTime: dataConfidence.nextRetryTime || "next refresh"
        };
        el.textContent = valueMap[field] || "Not recorded";
    });
}

function setStatus(message = compactConfidenceMessage(), isLive = true) {
    document.querySelectorAll("#market-status").forEach(el => {
        el.textContent = message;
    });
    document.querySelectorAll(".status-dot").forEach(el => {
        el.style.background = isLive ? "var(--green)" : "var(--orange)";
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
        if (shouldForceFallback()) throw new Error("Forced fallback snapshot");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const url = proxyUrl || `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`;
        const response = await fetch(url, {
            headers: { "accept": "application/json" },
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
        setStatus(compactConfidenceMessage(), true);
        setLastUpdatedLabel();
        return normalizeMarkets(rows, provider);
    } catch (error) {
        dataConfidence.mode = "Fallback Snapshot";
        dataConfidence.provider = MARKET_PROVIDERS.fallbackSnapshot;
        dataConfidence.failureReason = error.failureReason || classifyFetchFailure(error);
        dataConfidence.retryCount += 1;
        dataConfidence.isFallback = true;
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

    document.getElementById("analysis-panel").innerHTML = selected
        ? analysisHtml(selected, portfolioValue)
        : `<div class="empty-analysis">Select an asset from the Opportunity Queue to inspect structure, plan the trade, and unlock execution handoff.</div>`;

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
                <td class="num">${formatBalance(row.holding.balance)}</td>
                <td class="num">${row.market ? formatPrice(row.market.current_price) : "Price unavailable"}</td>
                <td class="num">${row.holding.avgEntryPrice ? formatPrice(row.holding.avgEntryPrice) : "Entry not set"}</td>
                <td class="num ${unrealized.aud > 0 ? "positive" : unrealized.aud < 0 ? "negative" : "neutral"}">${unrealized.label}</td>
                <td>${holdingDuration(row.holding.updatedAt)}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="6" class="loading-cell">No manual holdings saved.</td></tr>`;

    document.getElementById("portfolio-value").textContent = formatPrice(portfolioValue);
    renderHoldingsAllocation(holdingRows, portfolioValue);
    renderHoldingsManager(markets, holdingRows);

    const highVolume = [...markets].sort((a, b) => b.total_volume - a.total_volume).slice(0, 8);
    document.getElementById("popular-now").innerHTML = highVolume.map(tile).join("");

    const recent = [...markets].sort((a, b) =>
        Math.abs(b.price_change_percentage_1h_in_currency || 0) - Math.abs(a.price_change_percentage_1h_in_currency || 0)
    ).slice(0, 6);
    document.getElementById("recent-movers-body").innerHTML = recent.map(coin => `
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
    document.getElementById("new-coins-body").innerHTML = newCoins.map(coin => `
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
    if (portfolioEl) portfolioEl.textContent = formatPrice(portfolioValue);
    if (!holdingEl) return;
    const activeRows = holdingRows.filter(row => row.holding.balance > 0);
    if (!activeRows.length) {
        holdingEl.textContent = "No active holdings";
        return;
    }
    const lead = [...activeRows].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
    const valueText = lead.value === null ? "Price unavailable" : formatPrice(lead.value);
    holdingEl.textContent = `${lead.holding.symbol} ${formatBalance(lead.holding.balance)} / ${valueText}`;
}

function analysisHtml(selected, portfolioValue) {
    const state = guideStateFor(selected);
    const confirmed = planConfirmedAssetId === selected.coin.id;
    const selectedCoinspotUrl = confirmed ? coinspotUrl(selected.coin) : null;
    const defaultSize = Math.max(0, portfolioValue * 0.1);
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
        <div class="trade-plan-box">
            <div class="mini-title">Trade Plan</div>
            <label>Why now?<textarea id="plan-reason">${escapeHtml(swingReasonFor(selected))}</textarea></label>
            <label>Entry trigger<input id="plan-trigger" type="text" value="${escapeHtml(state.label)} confirmation"></label>
            <label>Invalidation<input id="plan-invalidation" type="text" value="${escapeHtml(invalidationSentence(state.label))}"></label>
            <label>Target review time<input id="plan-review" type="datetime-local" value="${formatDateTimeLocal(Date.now() + 86400000)}"></label>
            <label>Intended position size<input id="plan-size" type="number" min="0" step="any" value="${defaultSize.toFixed(2)}"></label>
            <label>Notes<textarea id="plan-notes" placeholder="Manual notes"></textarea></label>
            <div class="form-actions">
                <button class="table-action" type="button" id="confirm-plan">Confirm Plan</button>
                <button class="table-action" type="button" id="save-plan-journal">Save to Journal</button>
                <button class="table-action" type="button" id="add-analysis-watch">Add to Watch</button>
            </div>
        </div>
        <div class="position-helper">
            <div class="mini-title">Position Size Helper</div>
            <div class="size-grid">
                <label>Portfolio value<input id="size-portfolio" type="number" min="0" step="any" value="${portfolioValue.toFixed(2)}"></label>
                <label>Allocation %<input id="size-allocation" type="number" min="0" step="any" value="10"></label>
                <label>Risk level<select id="size-risk"><option>${riskFor(selected)}</option><option>Low</option><option>Medium</option><option>High</option></select></label>
                <label>Max risk AUD<input id="size-risk-amount" type="number" min="0" step="any" value="${Math.max(0, portfolioValue * 0.02).toFixed(2)}"></label>
            </div>
            <div class="helper-output" id="size-output">Sizing helper only. Final trade decision is external.</div>
        </div>
        <div class="execution-bar">
            <span>${confirmed ? "Trade plan confirmed. Execution handoff is available for this asset." : "Confirm a trade plan before execution handoff."}</span>
            ${selectedCoinspotUrl
                ? `<a class="button-primary" href="${selectedCoinspotUrl}" target="_blank" rel="noopener noreferrer">Open CoinSpot</a>`
                : confirmed ? `<span class="watch-only">CoinSpot link unavailable</span>` : `<span class="watch-only">Plan required</span>`}
        </div>
    `;
}

function attachAnalysisControls(selected, portfolioValue) {
    if (!selected) return;
    const updateSizing = () => {
        const out = document.getElementById("size-output");
        if (!out) return;
        const portfolio = Math.max(0, finiteNumber(document.getElementById("size-portfolio")?.value, portfolioValue));
        const allocation = Math.max(0, finiteNumber(document.getElementById("size-allocation")?.value, 0));
        const maxRisk = Math.max(0, finiteNumber(document.getElementById("size-risk-amount")?.value, 0));
        const position = portfolio * (allocation / 100);
        const capped = maxRisk > 0 ? Math.min(position, maxRisk / 0.1) : position;
        const units = selected.coin.current_price > 0 ? capped / selected.coin.current_price : 0;
        const after = portfolio > 0 ? (capped / portfolio) * 100 : 0;
        out.textContent = `Suggested position ${formatPrice(capped)} / est. ${formatBalance(units)} ${selected.coin.symbol.toUpperCase()} / allocation ${after.toFixed(1)}%. Sizing helper only. Final trade decision is external.`;
    };
    ["size-portfolio", "size-allocation", "size-risk-amount", "size-risk"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", updateSizing);
        document.getElementById(id)?.addEventListener("change", updateSizing);
    });
    updateSizing();
    document.getElementById("confirm-plan")?.addEventListener("click", () => {
        planConfirmedAssetId = selected.coin.id;
        renderDashboard(currentDashboardModel);
    });
    document.getElementById("save-plan-journal")?.addEventListener("click", () => {
        planConfirmedAssetId = selected.coin.id;
        addTrade(planTradeFromSelection(selected));
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

function planTradeFromSelection(selected) {
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
        notes: safeText(document.getElementById("plan-notes")?.value, ""),
        status: "open"
    };
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

function performanceMetrics() {
    const trades = tradeJournal.map(normalizeTrade);
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
        worstSignal: bySignal.sort((a, b) => a.avg - b.avg)[0]?.signal || "Not enough data"
    };
}

function renderPerformanceSummary(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const metrics = performanceMetrics();
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
        ["Best", formatSignedMoney(metrics.best.resultAud)],
        ["Worst", formatSignedMoney(metrics.worst.resultAud)],
        ["Net AUD", formatSignedMoney(metrics.net)],
        ["Most traded", metrics.mostTraded],
        ["Best signal", metrics.bestSignal],
        ["Worst signal", metrics.worstSignal]
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
        const handoffUrl = analysed && planConfirmedAssetId === item.coin.id ? coinspotUrl(item.coin) : null;
        const action = handoffUrl
            ? `<a class="table-action" href="${handoffUrl}" target="_blank" rel="noopener noreferrer">CoinSpot</a>`
            : supported === "Supported" && !analysed
                ? `<button class="table-action" type="button" data-asset-id="${item.coin.id}">Analyse</button>`
                : analysed && supported === "Supported" ? "Plan required" : "Watch only";
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
    pie.innerHTML = lead ? `${lead.holding.symbol}<br>${leadPercent}%` : "0%";

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
                <td class="num">${allocation}</td>
                <td class="num">${row.value === null ? "Price unavailable" : formatPrice(row.value)}</td>
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
            <td class="num"><input class="inline-balance" type="number" min="0" step="any" value="${row.holding.balance}" data-balance-symbol="${escapeHtml(row.holding.symbol)}"></td>
            <td class="num"><input class="inline-balance" type="number" min="0" step="any" value="${row.holding.avgEntryPrice || ""}" data-entry-symbol="${escapeHtml(row.holding.symbol)}" placeholder="Entry not set"></td>
            <td class="num">${row.market ? formatPrice(row.market.current_price) : "Price unavailable"}</td>
            <td class="num ${unrealizedFor(row).aud > 0 ? "positive" : unrealizedFor(row).aud < 0 ? "negative" : "neutral"}">${unrealizedFor(row).label}</td>
            <td><input class="inline-note" type="text" value="${escapeHtml(row.holding.note)}" data-note-symbol="${escapeHtml(row.holding.symbol)}" placeholder="None"></td>
            <td>${holdingDuration(row.holding.updatedAt)}</td>
            <td>${formatTimestamp(row.holding.updatedAt)}</td>
            <td>
                <button class="table-action" type="button" data-save-holding="${escapeHtml(row.holding.symbol)}">Save</button>
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
    document.getElementById("today-up-body").innerHTML = up.map(row).join("");
    document.getElementById("today-down-body").innerHTML = down.map(row).join("");
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
    document.getElementById("logs-body").innerHTML = systemRows + rows;

    const { markets } = model;
    const watchlist = WATCHLIST_IDS.map(id => byId(markets, id)).filter(Boolean);
    document.getElementById("logs-watchlist-body").innerHTML = watchlist.map(coin => `
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
    document.getElementById("alerts-body").innerHTML = rows || `<tr><td colspan="6" class="loading-cell">No threshold events in the current market state.</td></tr>`;
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
        ["Best result", best ? formatSignedMoney(best.resultAud) : "Not recorded"],
        ["Worst result", worst ? formatSignedMoney(worst.resultAud) : "Not recorded"],
        ["Net AUD result", formatSignedMoney(net)]
    ].map(([label, value]) => reportMetric(label, value)).join("");
    note.textContent = opened.length || closedToday.length
        ? "Daily notes: review entries, exits, and whether the plan was followed."
        : "No trades logged for this day.";
}

function renderWeeklyReport() {
    const el = document.getElementById("weekly-report-summary");
    if (!el) return;
    const metrics = performanceMetrics();
    if (!metrics.enough) {
        el.innerHTML = `<div class="empty-analysis compact-empty">Not enough closed trades yet.</div>`;
        return;
    }
    el.innerHTML = [
        ["Total trades", metrics.trades.length],
        ["Open trades", metrics.open.length],
        ["Closed trades", metrics.closed.length],
        ["Win rate", `${metrics.winRate.toFixed(1)}%`],
        ["Average gain", `${metrics.avgGain.toFixed(2)}%`],
        ["Average loss", `${metrics.avgLoss.toFixed(2)}%`],
        ["Net AUD result", formatSignedMoney(metrics.net)],
        ["Best signal type", metrics.bestSignal],
        ["Worst signal type", metrics.worstSignal],
        ["Most traded asset", metrics.mostTraded]
    ].map(([label, value]) => reportMetric(label, value)).join("");
}

function renderTradeReviewReport(trades) {
    const body = document.getElementById("trade-review-body");
    if (!body) return;
    const closed = trades.filter(trade => trade.status === "closed");
    const mistakeOptions = ["No plan", "Entered too late", "Exited too early", "Ignored invalidation", "Oversized position", "Chased movement", "Other"];
    body.innerHTML = closed.length ? closed.map(trade => `
        <tr>
            <td>${escapeHtml(trade.symbol)} / ${escapeHtml(trade.name)}</td>
            <td>${escapeHtml(trade.reasonEntry)}</td>
            <td>${escapeHtml(trade.signalState)}</td>
            <td>${escapeHtml(trade.plannedInvalidation)}</td>
            <td>${escapeHtml(trade.exitReason || "Manual close")}</td>
            <td class="num ${trade.resultAud > 0 ? "positive" : trade.resultAud < 0 ? "negative" : "neutral"}">${trade.resultAud === null ? "Not recorded" : formatSignedMoney(trade.resultAud)}</td>
            <td class="num ${trade.resultPercent > 0 ? "positive" : trade.resultPercent < 0 ? "negative" : "neutral"}">${trade.resultPercent === null ? "Not recorded" : formatSignedPercent(trade.resultPercent)}</td>
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
    `).join("") : `<tr><td colspan="9" class="loading-cell">No closed trades to review.</td></tr>`;
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
    const rows = manualHoldings.map(holding => {
        const normalized = normalizeHolding(holding);
        const valuation = holdingValuation(model.markets, normalized);
        const unrealized = unrealizedFor({ holding: normalized, market: valuation.market });
        const stateRow = assetStateForReport(model, normalized);
        return { holding: normalized, valuation, unrealized, stateRow };
    }).filter(row => row.holding.symbol);
    body.innerHTML = rows.length ? rows.map(row => `
        <tr>
            <td>${escapeHtml(row.holding.symbol)} / ${escapeHtml(row.holding.name)}</td>
            <td class="num">${formatBalance(row.holding.balance)}</td>
            <td class="num">${row.holding.avgEntryPrice ? formatPrice(row.holding.avgEntryPrice) : "Entry not set"}</td>
            <td class="num">${row.valuation.market ? formatPrice(row.valuation.market.current_price) : "Price unavailable"}</td>
            <td class="num ${row.unrealized.aud > 0 ? "positive" : row.unrealized.aud < 0 ? "negative" : "neutral"}">${row.unrealized.aud === null ? row.unrealized.label : formatSignedMoney(row.unrealized.aud)}</td>
            <td class="num ${row.unrealized.percent > 0 ? "positive" : row.unrealized.percent < 0 ? "negative" : "neutral"}">${row.unrealized.percent === null ? row.unrealized.label : formatSignedPercent(row.unrealized.percent)}</td>
            <td>${holdingDuration(row.holding.updatedAt)}</td>
            <td>${escapeHtml(row.stateRow.state)}</td>
            <td>${escapeHtml(exitRiskForReport(row.stateRow, row.valuation))}</td>
        </tr>
    `).join("") : `<tr><td colspan="9" class="loading-cell">No holdings recorded.</td></tr>`;
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
        ["Most common signal at entry", mostCommon(trades.map(trade => trade.signalState), "Not enough data")]
    ].map(([label, value]) => reportMetric(label, value)).join("");
}

let currentReportModel = null;

function renderReports(model) {
    currentReportModel = model;
    const trades = tradeJournal.map(normalizeTrade);
    renderDailyReport(trades);
    renderWeeklyReport();
    renderTradeReviewReport(trades);
    renderPositionReport(model);
    renderBehaviourReport(trades);
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
}

function renderJournal() {
    const openBody = document.getElementById("open-trades-body");
    const closedBody = document.getElementById("closed-trades-body");
    if (!openBody || !closedBody) return;
    const trades = tradeJournal.map(normalizeTrade);
    const openRows = trades.filter(trade => trade.status !== "closed");
    const closedRows = trades.filter(trade => trade.status === "closed");
    openBody.innerHTML = openRows.length ? openRows.map(trade => `
        <tr>
            <td>${escapeHtml(trade.id)}</td>
            <td>${escapeHtml(trade.symbol)} / ${escapeHtml(trade.name)}</td>
            <td>${formatTimestamp(trade.entryDate)}</td>
            <td class="num">${formatPrice(trade.entryPrice)}</td>
            <td class="num">${formatPrice(trade.positionSize)}</td>
            <td>${escapeHtml(trade.signalState)}</td>
            <td>${escapeHtml(trade.plannedInvalidation)}</td>
            <td>
                <input class="inline-balance close-price" type="number" min="0" step="any" placeholder="Exit price" data-close-price="${escapeHtml(trade.id)}">
                <input class="inline-note close-reason" type="text" placeholder="Exit reason" data-close-reason="${escapeHtml(trade.id)}">
                <button class="table-action" type="button" data-close-trade="${escapeHtml(trade.id)}">Close</button>
            </td>
            <td>
                <button class="table-action" type="button" data-edit-trade="${escapeHtml(trade.id)}">Edit</button>
                <button class="table-action danger-action" type="button" data-delete-trade="${escapeHtml(trade.id)}">Delete</button>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="9" class="loading-cell">No open trades.</td></tr>`;
    closedBody.innerHTML = closedRows.length ? closedRows.map(trade => `
        <tr>
            <td>${escapeHtml(trade.id)}</td>
            <td>${escapeHtml(trade.symbol)} / ${escapeHtml(trade.name)}</td>
            <td>${formatTimestamp(trade.entryDate)} @ ${formatPrice(trade.entryPrice)}</td>
            <td>${formatTimestamp(trade.exitDate)} @ ${trade.exitPrice === null ? "Not recorded" : formatPrice(trade.exitPrice)}</td>
            <td class="num ${trade.resultAud > 0 ? "positive" : trade.resultAud < 0 ? "negative" : "neutral"}">${trade.resultAud === null ? "Not recorded" : formatSignedMoney(trade.resultAud)}</td>
            <td class="num ${trade.resultPercent > 0 ? "positive" : trade.resultPercent < 0 ? "negative" : "neutral"}">${trade.resultPercent === null ? "Not recorded" : formatSignedPercent(trade.resultPercent)}</td>
            <td>${escapeHtml(trade.exitReason || "Manual close")}</td>
            <td>
                <button class="table-action" type="button" data-edit-trade="${escapeHtml(trade.id)}">Edit</button>
                <button class="table-action danger-action" type="button" data-delete-trade="${escapeHtml(trade.id)}">Delete</button>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="8" class="loading-cell">No closed trades.</td></tr>`;
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
    renderPerformanceSummary("journal-performance-summary");
}

function fillJournalForm(id) {
    const trade = tradeJournal.map(normalizeTrade).find(row => row.id === id);
    if (!trade) return;
    document.getElementById("journal-id").value = trade.id;
    document.getElementById("journal-symbol").value = trade.symbol;
    document.getElementById("journal-name").value = trade.name;
    document.getElementById("journal-entry-date").value = formatDateTimeLocal(trade.entryDate);
    document.getElementById("journal-entry-price").value = trade.entryPrice;
    document.getElementById("journal-position-size").value = trade.positionSize;
    document.getElementById("journal-signal").value = trade.signalState;
    document.getElementById("journal-reason").value = trade.reasonEntry;
    document.getElementById("journal-invalidation").value = trade.plannedInvalidation;
    document.getElementById("journal-notes").value = trade.notes;
}

function clearJournalForm() {
    const form = document.getElementById("journal-form");
    if (!form) return;
    form.reset();
    document.getElementById("journal-id").value = "";
    document.getElementById("journal-entry-date").value = formatDateTimeLocal(new Date());
}

function initJournalControls() {
    const form = document.getElementById("journal-form");
    if (!form) return;
    clearJournalForm();
    form.addEventListener("submit", event => {
        event.preventDefault();
        const data = new FormData(form);
        const id = safeText(data.get("id"), "");
        const trade = normalizeTrade({
            id: id || journalId(),
            symbol: data.get("symbol"),
            name: data.get("name"),
            entryDate: new Date(data.get("entryDate")).toISOString(),
            entryPrice: data.get("entryPrice"),
            positionSize: data.get("positionSize"),
            signalState: data.get("signalState"),
            reasonEntry: data.get("reasonEntry"),
            plannedInvalidation: data.get("plannedInvalidation"),
            notes: data.get("notes"),
            status: tradeJournal.find(row => row.id === id)?.status || "open"
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

async function boot() {
    const markets = await getMarkets();
    const model = buildDecisionPipeline(markets);
    recordSignalHistory(model.assets);
    if (page === "dashboard") renderDashboard(model);
    if (page === "logs") renderLogs(model);
    if (page === "alerts") renderAlerts(model);
    if (page === "reports") renderReports(model);
}

boot();
if (page === "dashboard") {
    initHoldingsControls();
    initSecondaryTabs();
}
if (page === "journal") initJournalControls();
if (page === "reports") initReportsControls();
setInterval(boot, REFRESH_INTERVAL_MS);
