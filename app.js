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

const HOLDINGS = [
    { id: "bitcoin", symbol: "BTC", balance: 0.0001393 },
    { id: "litecoin", symbol: "LTC", balance: 0 },
    { id: "ethereum", symbol: "ETH", balance: 0 },
    { id: "ethereum-classic", symbol: "ETC", balance: 0 },
    { id: "binancecoin", symbol: "BNB", balance: 0 },
    { id: "tellor", symbol: "TRB", balance: 0 }
];

const page = document.body.dataset.page;

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

function percentClass(value) {
    const numeric = Number(value);
    if (numeric > 0) return "positive";
    if (numeric < 0) return "negative";
    return "neutral";
}

function byId(markets, id) {
    return markets.find(item => item.id === id);
}

function coinCell(coin) {
    const icon = coin.image
        ? `<img class="coin-icon" src="${coin.image}" alt="">`
        : `<span class="coin-icon"></span>`;
    return `<span class="coin">${icon}${coin.name}</span>`;
}

function setStatus(message, isLive = true) {
    document.querySelectorAll("#market-status").forEach(el => {
        el.textContent = message;
    });
    document.querySelectorAll(".status-dot").forEach(el => {
        el.style.background = isLive ? "var(--green)" : "var(--orange)";
    });
}

async function getMarkets() {
    const params = new URLSearchParams({
        vs_currency: "aud",
        order: "market_cap_desc",
        per_page: "100",
        page: "1",
        sparkline: "true",
        price_change_percentage: "1h,24h"
    });

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`, {
            headers: { "accept": "application/json" },
            cache: "no-store"
        });
        if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
        const data = await response.json();
        setStatus(`Live data updated ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`);
        return Array.isArray(data) && data.length ? data : FALLBACK_MARKETS;
    } catch (error) {
        setStatus("Live API unavailable - showing fallback snapshot", false);
        return FALLBACK_MARKETS;
    }
}

function sellPrice(price) {
    return price * 0.99015;
}

function renderChart(coin) {
    const svg = document.getElementById("portfolio-chart");
    if (!svg) return;
    const prices = coin?.sparkline_in_7d?.price?.slice(-32) || [12, 12.4, 12.8, 13, 13.4, 14.2, 14.8, 15.1, 15.4];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const width = 420;
    const height = 172;
    const padX = 28;
    const padTop = 20;
    const padBottom = 24;
    const plotW = width - 56;
    const plotH = height - padTop - padBottom;
    const points = prices.map((price, index) => {
        const x = padX + (index / Math.max(prices.length - 1, 1)) * plotW;
        const y = padTop + (1 - ((price - min) / Math.max(max - min, 0.000001))) * plotH;
        return [x, y];
    });
    const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${height - padBottom} L${padX} ${height - padBottom} Z`;

    svg.innerHTML = `
        <line x1="28" y1="24" x2="392" y2="24" stroke="#edf1f4"/>
        <line x1="28" y1="55" x2="392" y2="55" stroke="#edf1f4"/>
        <line x1="28" y1="86" x2="392" y2="86" stroke="#edf1f4"/>
        <line x1="28" y1="117" x2="392" y2="117" stroke="#edf1f4"/>
        <line x1="28" y1="148" x2="392" y2="148" stroke="#edf1f4"/>
        <path d="${area}" fill="rgba(8,120,186,0.10)"/>
        <path d="${line}" fill="none" stroke="#0878ba" stroke-width="3"/>
        <text x="30" y="166" fill="#8794a0" font-size="11">7D</text>
        <text x="180" y="166" fill="#8794a0" font-size="11">Live AUD</text>
        <text x="342" y="166" fill="#8794a0" font-size="11">Now</text>
    `;
}

function renderDashboard(markets) {
    const watchlist = WATCHLIST_IDS.map(id => byId(markets, id)).filter(Boolean);
    const btc = byId(markets, "bitcoin") || watchlist[0];
    const portfolioValue = HOLDINGS.reduce((total, holding) => {
        const coin = byId(markets, holding.id);
        return total + (coin ? coin.current_price * holding.balance : 0);
    }, 0);

    document.getElementById("watchlist-body").innerHTML = watchlist.map(coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num">${formatPrice(sellPrice(coin.current_price))}</td>
            <td class="num">${formatBig(coin.market_cap)}</td>
            <td class="num">${formatBig(coin.total_volume)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_24h)}">${formatPercent(coin.price_change_percentage_24h)}</td>
        </tr>
    `).join("");

    document.getElementById("wallets-body").innerHTML = HOLDINGS.map(holding => {
        const coin = byId(markets, holding.id) || { name: holding.symbol, current_price: 0, image: "" };
        return `
            <tr>
                <td>${coinCell({ ...coin, name: coin.name || holding.symbol })}</td>
                <td class="num">${holding.balance}</td>
                <td class="num">${formatPrice(holding.balance * (coin.current_price || 0))}</td>
            </tr>
        `;
    }).join("");

    document.getElementById("portfolio-value").textContent = formatPrice(portfolioValue);
    document.getElementById("holdings-body").innerHTML = `
        <tr><td>${coinCell({ ...btc, name: "BTC" })}</td><td class="num">${formatPrice(portfolioValue)}</td></tr>
    `;
    renderChart(btc);

    const highVolume = [...markets].sort((a, b) => b.total_volume - a.total_volume).slice(0, 8);
    document.getElementById("popular-now").innerHTML = highVolume.map(tile).join("");
    document.getElementById("popular-today").innerHTML = highVolume.slice(0, 8).reverse().map(tile).join("");

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

    document.getElementById("new-coins").innerHTML = markets.slice(24, 28).map(tile).join("");
    renderTodayMovers(markets);
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
    return `
        <span class="coin-tile">
            ${coin.image ? `<img class="coin-icon" src="${coin.image}" alt="">` : `<span class="coin-icon"></span>`}
            <span>${coin.symbol.toUpperCase()}</span>
        </span>
    `;
}

function signalFor(coin) {
    const oneHour = coin.price_change_percentage_1h_in_currency || 0;
    const day = coin.price_change_percentage_24h || 0;
    if (day > 5 && oneHour > 0) return { label: "BUY", klass: "buy", note: "Strong 24hr momentum with positive 1hr confirmation." };
    if (day < -3) return { label: "SELL RISK", klass: "sell", note: "Price is under live 24hr pressure." };
    if (day > 2) return { label: "WATCH", klass: "watch", note: "Momentum building; wait for confirmation." };
    return { label: "WAIT", klass: "wait", note: "No clear live edge yet." };
}

function renderLogs(markets) {
    const rows = markets.slice(0, 16).map(coin => {
        const signal = signalFor(coin);
        return `
            <tr>
                <td>${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Brisbane" })}</td>
                <td>${coinCell(coin)}</td>
                <td class="num">${formatPrice(coin.current_price)}</td>
                <td class="num ${percentClass(coin.price_change_percentage_1h_in_currency)}">${formatPercent(coin.price_change_percentage_1h_in_currency)}</td>
                <td class="num ${percentClass(coin.price_change_percentage_24h)}">${formatPercent(coin.price_change_percentage_24h)}</td>
                <td><span class="badge ${signal.klass}">${signal.label}</span></td>
                <td>${signal.note}</td>
            </tr>
        `;
    }).join("");
    document.getElementById("logs-body").innerHTML = rows;

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

function renderAlerts(markets) {
    const highVolume = [...markets].sort((a, b) => b.total_volume - a.total_volume).slice(0, 5);
    const alertCoins = [...markets]
        .filter(coin => (coin.price_change_percentage_24h || 0) > 2 || (coin.price_change_percentage_24h || 0) < -3)
        .slice(0, 18);
    const combined = [...new Map([...alertCoins, ...highVolume].map(coin => [coin.id, coin])).values()].slice(0, 18);
    document.getElementById("alerts-body").innerHTML = combined.map(coin => {
        const day = coin.price_change_percentage_24h || 0;
        const oneHour = coin.price_change_percentage_1h_in_currency || 0;
        const severity = day > 5 ? "strong" : day < -3 ? "risk" : "watch";
        const label = severity === "strong" ? "Strong Buy" : severity === "risk" ? "Sell Risk" : "Watch";
        const text = severity === "strong"
            ? "24hr breakout with live positive momentum."
            : severity === "risk"
                ? "Live downside pressure is above risk threshold."
                : "Momentum is active; watch for confirmation.";
        return `
            <tr>
                <td><span class="badge ${severity}">${label}</span></td>
                <td>${coinCell(coin)}</td>
                <td class="num">${formatPrice(coin.current_price)}</td>
                <td class="num ${percentClass(oneHour)}">${formatPercent(oneHour)}</td>
                <td class="num ${percentClass(day)}">${formatPercent(day)}</td>
                <td>${text}</td>
            </tr>
        `;
    }).join("");
}

async function boot() {
    const markets = await getMarkets();
    if (page === "dashboard") renderDashboard(markets);
    if (page === "logs") renderLogs(markets);
    if (page === "alerts") renderAlerts(markets);
}

boot();
setInterval(boot, 60000);
