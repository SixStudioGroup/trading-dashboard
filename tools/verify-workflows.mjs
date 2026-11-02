#!/usr/bin/env node
// SixQuant workflow verifier. Runs the site in headless Chrome against made-up
// fixture data, with no server and no real prices:
//   - a throwaway Chrome profile and a new browser context per scenario, so it
//     never sees or changes anyone's saved records
//   - every request to https://sixquant.test is answered from local files; data/*
//     is answered from the fixtures below
//   - coinspot.com.au is pointed at a dead address, so the link can be followed
//     and recorded while nothing ever reaches the exchange
//
// Usage:  node tools/verify-workflows.mjs [--root <dir>] [--shots <dir>]
//         --shots saves screenshots and column measurements and skips the checks.
// Exit:   0 all pass, 1 any failure, 2 harness error.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : ""; };
const ROOT = resolve(arg("--root") || join(fileURLToPath(import.meta.url), "..", ".."));
const SHOTS = arg("--shots");
const ORIGIN = "https://sixquant.test";
const PORT = Number(process.env.CDP_PORT || 9445);
const CHROME = process.env.CHROME_PATH || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : "google-chrome");
const SQ = createRequire(import.meta.url)(join(ROOT, "sq-core.js"));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/json" };

// ---------- fixtures: every price and record is invented. One company name is
// the feed's longest real one, because table layout depends on its true width. ----------
const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString();
const LONGEST_COMPANY = "Commonwealth Bank of Australia";
function cryptoFixture(ageHours) {
  const rows = [
    ["bitcoin", "btc", 1000, 1.0, 0.4, 9e9], ["ethereum", "eth", 500, 6.0, 0.5, 8e9], ["binancecoin", "bnb", 90, 2.5, -0.2, 7e9],
    ["cardano", "ada", 0.5, -4.0, -1.2, 6e9], ["dogecoin", "doge", 0.2, 1.2, null, 5e9], ["litecoin", "ltc", 80, 0.2, 0.1, 4e8],
    ["polkadot", "dot", 2, 3.1, 0.3, 3e8], ["theta-token", "theta", 0.3, -0.5, 0, 2e8], ["near", "near", 3, 0.9, 0.2, 1e8]
  ];
  return {
    schema: "sixquant.crypto.snapshot.v1", source: "FIXTURE", lastUpdated: hoursAgo(ageHours), count: rows.length,
    data: rows.map(([id, symbol, priceAud, change24h, change1h, volume24hAud], i) => ({
      id, symbol, name: `Fixture ${symbol.toUpperCase()}`, priceAud, marketCapAud: 1e10 - i * 1e8, volume24hAud, change1h, change24h, rank: i + 1, image: "",
      sparkline_in_7d: { price: [1, 1.1, 1.05, 1.2].map(v => v * priceAud) }
    }))
  };
}
function asxFixture(lastSessionDate) {
  const rows = [["ZZA", "Breakout", LONGEST_COMPANY], ["ZZB", "Volume Spike", "Westpac Banking Corporation"], ["ZZC", "Watch", "Fixture Company ZZC"], ["ZZD", "No Action", "Fixture Company ZZD"], ["ZZE", "Sell Risk", "Fixture Company ZZE"]];
  return {
    schema: "sixquant.asx.feed.v2", source: "FIXTURE", mode: "delayed", dataClass: "delayed-unlicensed", lastUpdated: hoursAgo(2), lastUpdatedSydney: "02/11/2026 18:11 AEDT", asxHolidays: [], lastSessionDate, fetchErrors: [],
    universeMeta: { name: "Fixture list", revision: 1, asOf: lastSessionDate },
    assets: rows.map(([symbol, signalState, name], i) => ({
      symbol, name, exchange: "ASX", sector: "Communication Services", price: 166.72 + i, change1d: 10.5 - i * 5, change5d: 12.5 - i * 6, change5dPartial: false, relativeVolume: 1.5 - i * 0.2, lastBarDate: lastSessionDate,
      ma20: 9.5, ma50: 9, ma200: 8.5, atr14: 0.3, high20: 11, low20: 9, trend: "Mixed", marketRegime: "Mixed", region: "Australia", currency: "AUD", signalState, riskState: "Normal"
    }))
  };
}
const expected = SQ.expectedSession(new Date());
const SCENARIOS = {
  fresh: { crypto: cryptoFixture(10 / 60), asx: asxFixture(expected) },
  sevenHours: { crypto: cryptoFixture(7), asx: asxFixture(expected) },
  stale: { crypto: cryptoFixture(72), asx: asxFixture("2026-01-05") },
  missing: { crypto: null, asx: null }
};
function dataResponse(scenario, path) {
  const s = SCENARIOS[scenario];
  if (path === "data/crypto-snapshot.json") return s.crypto;
  if (path === "data/asx-feed.json") return s.asx;
  if (path === "data/asx-history.json") return s.asx ? { schema: "x", lastUpdated: hoursAgo(2), series: {} } : null;
  if (path === "data/heartbeat-crypto.json") return s.crypto ? { feed: "crypto", lastRun: s.crypto.lastUpdated, status: "ok" } : null;
  if (path === "data/heartbeat-asx.json") return s.asx ? { feed: "asx", lastRun: s.asx.lastUpdated, status: "ok" } : null;
  return null;
}

// ---------- CDP ----------
let ws;
let nextId = 0;
const waiting = new Map();
const handlers = [];
const cdp = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const id = ++nextId;
  waiting.set(id, { res, rej, method });
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});
const newTargets = [];
async function connect() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const info = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      ws = new WebSocket(info.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
      ws.addEventListener("message", ev => {
        const msg = JSON.parse(ev.data);
        if (msg.id && waiting.has(msg.id)) {
          const w = waiting.get(msg.id);
          waiting.delete(msg.id);
          if (msg.error) w.rej(new Error(`${w.method}: ${msg.error.message}`)); else w.res(msg.result);
          return;
        }
        if (msg.method === "Target.targetCreated" || msg.method === "Target.targetInfoChanged") newTargets.push(msg.params.targetInfo);
        handlers.forEach(h => h(msg));
      });
      await cdp("Target.setDiscoverTargets", { discover: true });
      return;
    } catch { await sleep(300); }
  }
  throw new Error("Chrome did not start");
}

// A page in its own browser context: its own localStorage, gone when closed.
async function openContext(scenario, { width = 1920, height = 1200 } = {}) {
  const { browserContextId } = await cdp("Target.createBrowserContext");
  const downloads = mkdtempSync(join(tmpdir(), "sq-dl-"));
  await cdp("Browser.setDownloadBehavior", { behavior: "allow", browserContextId, downloadPath: downloads });
  const { targetId } = await cdp("Target.createTarget", { url: "about:blank", browserContextId, width, height });
  const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
  const errors = [];
  const blocked = [];
  const onMsg = msg => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === "Fetch.requestPaused") serve(msg.params);
  };
  handlers.push(onMsg);
  const serve = async ({ requestId, request }) => {
    const url = new URL(request.url);
    try {
      if (url.origin === ORIGIN) {
        const path = decodeURIComponent(url.pathname).replace(/^\//, "") || "index.html";
        let body = null;
        let type = MIME[extname(path)] || "application/octet-stream";
        if (path.startsWith("data/")) {
          const json = dataResponse(scenario, path);
          if (json) body = Buffer.from(JSON.stringify(json));
        } else if (existsSync(join(ROOT, path))) {
          body = readFileSync(join(ROOT, path));
        }
        if (!body) return await cdp("Fetch.fulfillRequest", { requestId, responseCode: 404, body: "" }, sessionId);
        return await cdp("Fetch.fulfillRequest", { requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: type }], body: body.toString("base64") }, sessionId);
      }
      if (/fonts\.(googleapis|gstatic)\.com|unpkg\.com/.test(url.host)) return await cdp("Fetch.continueRequest", { requestId }, sessionId);
      blocked.push(request.url);
      return await cdp("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" }, sessionId);
    } catch { /* page moved on */ return undefined; }
  };
  await cdp("Page.enable", {}, sessionId);
  await cdp("Runtime.enable", {}, sessionId);
  await cdp("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId);
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
  const evaluate = async expr => {
    const r = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}\n${expr.slice(0, 120)}`);
    return r.result.value;
  };
  const until = async (expr, what = expr, ms = 12000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await evaluate(`Boolean(${expr})`).catch(() => false)) return true;
      await sleep(120);
    }
    throw new Error(`timed out waiting for ${what}`);
  };
  const go = async page => {
    await cdp("Page.navigate", { url: `${ORIGIN}/${page}` }, sessionId);
    await until(`document.readyState === "complete"`, `load ${page}`);
  };
  const setPrivate = async page => {
    await go(page);
    await evaluate(`localStorage.setItem("sixquant.portalMode.v1", "private")`);
    await go(page);
  };
  const close = async () => {
    handlers.splice(handlers.indexOf(onMsg), 1);
    await cdp("Target.disposeBrowserContext", { browserContextId });
    rmSync(downloads, { recursive: true, force: true });
  };
  return { sessionId, evaluate, until, go, setPrivate, close, errors, blocked, downloads };
}

// ---------- checks ----------
const results = [];
const check = (name, pass, detail = "") => results.push({ name, pass: Boolean(pass), detail: String(detail) });
const text = sel => `(document.querySelector(${JSON.stringify(sel)})?.textContent || "")`;
const oneHourCells = `[...document.querySelectorAll("#opportunities-body tr")].map(r => ({ coin: r.cells[0].textContent.trim(), signal: r.cells[1].textContent.trim(), hour: r.cells[4].textContent.trim(), title: r.cells[4].querySelector("abbr")?.title || "" }))`;
const planFill = `(() => {
  const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
  set("plan-reason", "Fixture thesis written out for this test");
  set("plan-trigger", "Fixture trigger");
  set("risk-invalid-price", "450");
  set("plan-size", "500");
  set("size-portfolio", "10000");
  document.querySelectorAll("[data-handoff-check]").forEach(el => { el.checked = true; el.dispatchEvent(new Event("change", { bubbles: true })); });
})()`;
const selectEth = `document.querySelector('#opportunities-body [data-asset-id="ethereum"]').click()`;

async function scenarioStaleOneHour() {
  const c = await openContext("sevenHours");
  await c.go("index.html");
  await c.until(`document.querySelector("#opportunities-body tr td:nth-child(5)")?.textContent.trim() && !document.querySelector("#opportunities-body .skeleton-row")`, "crypto rows");
  const rows = await c.evaluate(oneHourCells);
  check("7h snapshot: every 1hr cell reads Unavailable", rows.length > 0 && rows.every(r => r.hour === "Unavailable"), JSON.stringify(rows.map(r => r.hour)));
  check("7h snapshot: each cell explains why", rows.every(r => /7h old/.test(r.title) && /under 1h/.test(r.title)), rows[0]?.title);
  check("7h snapshot: no Breakout state without fresh 1hr data", rows.every(r => r.signal !== "Breakout"), rows.map(r => r.signal).join());
  check("7h snapshot: status reads DELAYED", /DELAYED/.test(await c.evaluate(text("#market-status"))), await c.evaluate(text("#market-status")));
  check("7h snapshot: 1hr Movers explains itself", /unavailable/i.test(await c.evaluate(text("#recent-movers-body"))));
  check("7h snapshot: intro explains the 1hr rule", /under 1 hour old/.test(await c.evaluate(text(".six-title-block"))));
  await c.evaluate(selectEth);
  await c.until(`document.querySelector(".metric-grid")`, "cockpit");
  const momentum = await c.evaluate(`[...document.querySelectorAll(".consensus-grid span")][0].textContent`);
  check("7h snapshot: momentum rule does not count a missing 1hr as support", /Watch/.test(momentum) && /1h unavailable/.test(momentum), momentum);
  await c.go("logs.html");
  await c.until(`document.querySelector("#logs-body tr td:nth-child(4)")`, "logs rows");
  const logCells = await c.evaluate(`[...document.querySelectorAll("#logs-body tr")].map(r => r.cells[3].textContent.trim())`);
  check("7h snapshot: Evidence page 1hr also Unavailable", logCells.length && logCells.every(v => v === "Unavailable"), logCells.join());
  check("7h snapshot: no page errors", !c.errors.length, c.errors.join(" | "));
  await c.close();
}

async function scenarioFreshOneHour() {
  const c = await openContext("fresh");
  await c.go("index.html");
  await c.until(`document.querySelector("#opportunities-body tr td:nth-child(5)") && !document.querySelector("#opportunities-body .skeleton-row")`, "crypto rows");
  const rows = await c.evaluate(oneHourCells);
  const eth = rows.find(r => /ETH/.test(r.coin));
  const doge = rows.find(r => /DOGE/.test(r.coin));
  const theta = rows.find(r => /THETA/.test(r.coin));
  check("fresh snapshot: real 1hr value shows", /0\.50%/.test(eth?.hour), eth?.hour);
  check("fresh snapshot: real 0 shows as a number", /0\.00%/.test(theta?.hour), theta?.hour);
  check("fresh snapshot: coin with no 1hr value reads Unavailable", doge?.hour === "Unavailable" && /no 1hr value/.test(doge.title), doge?.title);
  check("fresh snapshot: Breakout can appear", eth?.signal === "Breakout", eth?.signal);

  // Crypto plan and the CoinSpot link, in Private Local mode with fresh data.
  await c.setPrivate("index.html");
  await c.until(`document.querySelector('#opportunities-body [data-asset-id="ethereum"]')`, "crypto rows");
  const hrefs = `[...document.querySelectorAll("#trade-guide-body a")].map(a => a.href)`;
  check("before the gate: no CoinSpot link", !(await c.evaluate(hrefs)).length);
  await c.evaluate(selectEth);
  await c.until(`document.getElementById("plan-reason")`, "plan form");
  check("cockpit states not live-trade-ready", /Not live-trade-ready/.test(await c.evaluate(text(".execution-bar"))), await c.evaluate(text(".execution-bar")));
  check("before the gate, ETH selected: no CoinSpot link", !(await c.evaluate(hrefs)).length);
  await c.evaluate(planFill);
  await c.evaluate(`document.getElementById("confirm-plan").click()`);
  await c.until(`document.querySelector("#trade-guide-body a")`, "CoinSpot link after gate");
  const links = await c.evaluate(hrefs);
  check("after the gate: link is CoinSpot's coin page with no order details", links.length === 1 && links[0] === "https://www.coinspot.com.au/buy/eth", links.join());
  await c.evaluate(`document.querySelector(".trade-guide-panel").open = true`);
  newTargets.length = 0;
  // A real mouse click: browsers block pop-ups opened by a scripted click.
  const box = await c.evaluate(`(() => { const a = document.querySelector("#trade-guide-body a"); a.scrollIntoView({ block: "center" }); const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  for (const type of ["mousePressed", "mouseReleased"]) await cdp("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 }, c.sessionId);
  await sleep(2000);
  const opened = newTargets.map(t => t.url).filter(u => /coinspot/.test(u));
  check("clicking the link opens only that page (test blocks it reaching CoinSpot)", opened.length > 0 && opened.every(u => u.startsWith("https://www.coinspot.com.au/buy/eth")), opened.join());
  await c.evaluate(planFill);
  await c.evaluate(`document.getElementById("save-plan-journal").click()`);
  await sleep(300);
  const saved = await c.evaluate(`JSON.parse(localStorage.getItem("sixquant.tradeJournal.v1") || "[]")`);
  check("fresh data: crypto plan saves as paper, with stop and reason", saved.length === 1 && /eth/i.test(saved[0].symbol) && saved[0].mode === "paper" && saved[0].stopPrice === 450 && /Fixture thesis/.test(saved[0].reasonEntry), JSON.stringify(saved[0] || {}).slice(0, 180));
  check("fresh data: no page errors", !c.errors.length, c.errors.join(" | "));
  await c.close();
}

async function scenarioDemoAndStaleCrypto() {
  for (const [scenario, word, kind] of [["missing", "DEMO", "Demo"], ["stale", "STALE", "Stale"]]) {
    const c = await openContext(scenario);
    await c.setPrivate("index.html");
    await c.until(`document.querySelector('#opportunities-body [data-asset-id]') && /${word}/.test(document.getElementById("market-status").textContent)`, `${word} status`);
    const status = await c.evaluate(text("#market-status"));
    check(`${word} crypto: status says ${word}`, new RegExp(word).test(status), status);
    check(`${word} crypto: diagnostics data state is ${kind}`, await c.evaluate(`document.querySelector('[data-confidence-field="dataKind"]').textContent`) === kind);
    const rows = await c.evaluate(oneHourCells);
    check(`${word} crypto: 1hr Unavailable`, rows.every(r => r.hour === "Unavailable"), rows.map(r => r.hour).join());
    check(`${word} crypto: nothing written to signal history`, await c.evaluate(`localStorage.getItem("sixquant.signalHistory.v1") === null`));
    await c.evaluate(`document.querySelector("#opportunities-body [data-asset-id]").click()`);
    await c.until(`document.getElementById("plan-reason")`, "plan form");
    await c.evaluate(planFill);
    await c.evaluate(`document.getElementById("confirm-plan").click(); document.getElementById("save-plan-journal").click()`);
    await sleep(300);
    check(`${word} crypto: plan blocked and no CoinSpot link`, await c.evaluate(`localStorage.getItem("sixquant.tradeJournal.v1") === null || JSON.parse(localStorage.getItem("sixquant.tradeJournal.v1")).length === 0`) && !(await c.evaluate(`document.querySelectorAll("#trade-guide-body a").length`)));
    check(`${word} crypto: message says why`, /Plans are blocked/.test(await c.evaluate(text("#plan-risk-message"))), await c.evaluate(text("#plan-risk-message")));
    check(`${word} crypto: no page errors`, !c.errors.length, c.errors.join(" | "));
    await c.close();
  }
}

const stockFillWith = stop => `(() => {
  const set = (id, v) => { document.getElementById(id).value = v; };
  set("stock-plan-position-size", "500"); set("stock-risk-invalidation-price", "${stop}"); set("stock-fee-target", "200");
  document.getElementById("stock-plan-form").requestSubmit();
})()`;
const stockFill = stockFillWith(150);
const pick = sym => `document.querySelector('[data-analyse-stock="${sym}"]').click()`;
async function scenarioStocks() {
  let c = await openContext("fresh");
  await c.setPrivate("stocks.html");
  await c.until(`document.querySelector('[data-analyse-stock="ZZA"]') && /DELAYED/.test(document.getElementById("stock-source-badge").textContent)`, "stocks rows");
  const page = await c.evaluate(`document.body.innerText`);
  check("Stocks: no 'Best setup' wording", !/best setup/i.test(page));
  check("Stocks: research watch names no single ticker", (await c.evaluate(text("#stock-research-watch"))) === "2 rule matches, unproven", await c.evaluate(text("#stock-research-watch")));
  check("Stocks: queue subtitle says delayed, unlicensed, unproven", /DELAYED, unlicensed/.test(await c.evaluate(text("#stock-queue-subtitle"))) && /unproven/.test(await c.evaluate(text("#stock-queue-subtitle"))));
  check("Stocks: data bar says DELAYED", /DELAYED/.test(await c.evaluate(text("#sq-asx-bar"))));
  await c.evaluate(pick("ZZA"));
  await c.until(`document.querySelector(".stock-agent-consensus")`, "cockpit");
  const cockpit = await c.evaluate(text("#stock-analysis-panel"));
  check("Stocks cockpit: signal marked unproven, no consensus claim", /Signal state \(unproven\)/.test(cockpit) && /Rule checks, unproven/.test(cockpit) && !/High Consensus/.test(cockpit));
  await c.evaluate(stockFill);
  await sleep(300);
  const plans = await c.evaluate(`JSON.parse(localStorage.getItem("sixquant.stocks.tradeJournal.v1") || "[]")`);
  check("Stocks: plan saves on delayed data", plans.length === 1 && plans[0].symbol === "ZZA", `${await c.evaluate(text("#stock-plan-message"))} | ${await c.evaluate(`[...document.querySelectorAll("#stock-plan-form :invalid")].map(e => e.id + ":" + e.value).join()`)} | ${JSON.stringify(plans).slice(0, 120)}`);
  check("Stocks: no page errors", !c.errors.length, c.errors.join(" | "));

  await c.go("planner.html?symbol=ZZA");
  await c.until(`document.getElementById("plan-checks")?.children.length`, "planner checks");
  await c.evaluate(`document.querySelector('input[name="plan-mode"][value="live"]').click()`);
  await c.until(`/Not live-trade-ready/.test(document.getElementById("plan-checks").textContent)`, "live warning");
  check("Planner: Live mode on delayed data shows not live-trade-ready", true);
  check("Planner: source badge says DELAYED", /DELAYED/.test(await c.evaluate(text("#stock-source-badge"))));
  await c.go("today.html");
  await c.until(`/DELAYED/.test(document.getElementById("sq-asx-bar").textContent) && /DELAYED/.test(document.getElementById("sq-crypto-line").textContent)`, "Today data lines");
  check("Today: ASX and crypto lines both say DELAYED", true);
  await c.close();

  c = await openContext("stale");
  await c.setPrivate("stocks.html");
  await c.until(`/STALE/.test(document.getElementById("stock-source-badge").textContent)`, "stale badge");
  check("Stale ASX: research watch paused", (await c.evaluate(text("#stock-research-watch"))) === "Paused: data stale", await c.evaluate(text("#stock-research-watch")));
  const existing = JSON.stringify([{ id: "FIX-OLD", symbol: "ZZA", status: "planned", referencePrice: 10, targetPrice: 99 }]);
  await c.evaluate(`localStorage.setItem("sixquant.stocks.tradeJournal.v1", ${JSON.stringify(existing)})`);
  await c.go("stocks.html");
  await c.until(`document.querySelector('[data-analyse-stock="ZZA"]') && /STALE/.test(document.getElementById("stock-source-badge").textContent)`, "stale rows");
  await c.evaluate(pick("ZZA"));
  await c.evaluate(stockFill);
  await sleep(300);
  check("Stale ASX: plan blocked with a reason", /Plan not recorded/.test(await c.evaluate(text("#stock-plan-message"))), await c.evaluate(text("#stock-plan-message")));
  check("Stale ASX: blocked plan leaves existing records untouched", (await c.evaluate(`localStorage.getItem("sixquant.stocks.tradeJournal.v1")`)) === existing, await c.evaluate(`localStorage.getItem("sixquant.stocks.tradeJournal.v1")`));
  await c.go("planner.html");
  await c.until(`/STALE/.test(document.getElementById("stock-source-badge").textContent)`, "planner stale badge");
  check("Stale ASX: planner agrees", /Hidden: data stale/.test(await c.evaluate(text("#stock-setups"))));
  await c.close();

  c = await openContext("missing");
  await c.setPrivate("stocks.html");
  await c.until(`/UNAVAILABLE/.test(document.getElementById("sq-asx-bar").textContent)`, "unavailable bar");
  check("No ASX feed: bar says UNAVAILABLE and prices say DEMO", /DEMO/.test(await c.evaluate(text("#stock-source-badge"))) && (await c.evaluate(text("#stock-research-watch"))) === "Demo prices only");
  await c.evaluate(pick("BHP"));
  await c.evaluate(stockFill);
  await sleep(300);
  check("No ASX feed: demo prices cannot reach saved plans", /DEMO prices/.test(await c.evaluate(text("#stock-plan-message"))) && await c.evaluate(`!localStorage.getItem("sixquant.stocks.tradeJournal.v1")`), await c.evaluate(text("#stock-plan-message")));
  await c.go("planner.html");
  await c.until(`/UNAVAILABLE/.test(document.getElementById("stock-source-badge").textContent)`, "planner unavailable");
  check("No ASX feed: planner agrees", true);
  check("No ASX feed: no page errors", !c.errors.length, c.errors.join(" | "));
  await c.close();
}

// A refused plan must leave the journal and the saved fee defaults byte-for-byte alone.
async function scenarioBlockedSubmit() {
  const PLANS = "sixquant.stocks.tradeJournal.v1";
  const FEES = "sixquant.stocks.auBrokerDefaults.v2";
  const seedPlans = symbol => JSON.stringify([{ id: "FIX-OLD", symbol, status: "planned", referencePrice: 166.72, targetPrice: 99, brokerageFee: 1, feePercent: 0.5, spreadPercent: 0.3, grossProfit: 11, netProfit: 9, totalCosts: 2, grossReturnPct: 1.1, netReturnPct: 0.9, breakevenPrice: 167, feeModelVersion: "release2" }]);
  const seedFees = JSON.stringify({ brokerageMode: "manual", spreadPercent: 0.2, brokerageFee: 7, feePercent: 0.1 });
  // Every fee field on the form differs from the saved values, so any write shows.
  const submit = (stop, size) => `(() => {
    const set = (id, v) => { document.getElementById(id).value = v; };
    set("stock-plan-position-size", "${size}"); set("stock-risk-invalidation-price", "${stop}"); set("stock-fee-target", "200");
    set("stock-fee-brokerage", "55"); set("stock-fee-percent", "5"); set("stock-fee-spread", "5");
    document.getElementById("stock-plan-form").requestSubmit();
  })()`;
  const run = async (name, scenario, symbol, stop, size) => {
    const c = await openContext(scenario);
    await c.setPrivate("stocks.html");
    const plans = seedPlans(symbol);
    await c.evaluate(`localStorage.setItem(${JSON.stringify(PLANS)}, ${JSON.stringify(plans)}); localStorage.setItem(${JSON.stringify(FEES)}, ${JSON.stringify(seedFees)})`);
    await c.go("stocks.html");
    const word = scenario === "missing" ? "DEMO" : scenario === "stale" ? "STALE" : "DELAYED";
    await c.until(`document.querySelector('[data-analyse-stock="${symbol}"]') && /${word}/.test(document.getElementById("stock-source-badge").textContent)`, `${name} rows`);
    await c.evaluate(pick(symbol));
    await c.evaluate(submit(stop, size));
    await sleep(400);
    const after = await c.evaluate(`({ plans: localStorage.getItem(${JSON.stringify(PLANS)}), fees: localStorage.getItem(${JSON.stringify(FEES)}), message: document.getElementById("stock-plan-message").textContent })`);
    await c.close();
    return { after, plans };
  };
  for (const [name, scenario, symbol, stop, size, why] of [
    ["stale data", "stale", "ZZA", 150, 500, /Plan not recorded/],
    ["demo prices", "missing", "BHP", 40, 500, /DEMO prices/],
    ["stop above entry", "fresh", "ZZA", 999, 500, /invalidation price below/],
    ["position over the cap", "fresh", "ZZA", 150, 9000, /exceeds/]
  ]) {
    const { after, plans } = await run(name, scenario, symbol, stop, size);
    check(`Blocked submit (${name}): says why`, why.test(after.message), after.message);
    check(`Blocked submit (${name}): existing plan and its fee data unchanged`, after.plans === plans, after.plans);
    check(`Blocked submit (${name}): saved fee defaults unchanged`, after.fees === seedFees, after.fees);
  }
  // Control: a plan that is allowed does write, so the checks above can detect a write.
  const { after, plans } = await run("control", "fresh", "ZZA", 150, 500);
  const row = JSON.parse(after.plans || "[]").find(p => p.symbol === "ZZA");
  check("Allowed submit (control): plan and fees do change", after.plans !== plans && after.fees !== seedFees && row?.brokerageFee === 55, after.plans);
}

// Truncation only where the table would otherwise clip, with nothing else moving.
async function scenarioNabtrade() {
  const PLANS = "sixquant.stocks.tradeJournal.v1";
  const FEES = "sixquant.stocks.auBrokerDefaults.v2";
  const c = await openContext("fresh");
  await c.setPrivate("stocks.html");
  // The old $5 default as an existing browser would hold it, plus a plan saved with it.
  const oldPlan = { id: "FIX-OLD", symbol: "ZZB", status: "planned", referencePrice: 10, positionSize: 1000, brokerageFee: 5, feePercent: 0, spreadPercent: 0.1 };
  await c.evaluate(`localStorage.setItem(${JSON.stringify(FEES)}, ${JSON.stringify(JSON.stringify({ brokerageFee: 5, feePercent: 0, spreadPercent: 0.1 }))}); localStorage.setItem(${JSON.stringify(PLANS)}, ${JSON.stringify(JSON.stringify([oldPlan]))})`);
  await c.go("stocks.html");
  await c.until(`document.querySelector('[data-analyse-stock="ZZA"]') && /DELAYED/.test(document.getElementById("stock-source-badge").textContent)`, "stocks rows");
  await c.evaluate(pick("ZZA"));
  await c.until(`document.querySelector(".stock-agent-consensus")`, "cockpit");
  const field = `document.getElementById("stock-fee-brokerage")`;
  check("nabtrade: Stocks brokerage field is calculated, not typed", await c.evaluate(`${field}.readOnly`));
  check("nabtrade: Stocks field is labelled nabtrade", /nabtrade/.test(await c.evaluate(`${field}.closest("label").textContent`)));
  const typeSize = v => c.evaluate(`(() => { const el = document.getElementById("stock-plan-position-size"); el.value = "${v}"; el.dispatchEvent(new Event("input", { bubbles: true })); return ${field}.value; })()`);
  for (const [size, fee] of [[500, "9.95"], [1000, "9.95"], [1000.01, "14.95"], [5000, "14.95"], [20000, "19.95"], [30000, "33.00"]]) {
    const got = await typeSize(size);
    check(`nabtrade: $${size} position shows $${fee} per side`, got === fee, got);
  }
  await c.evaluate(`(() => { const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }; set("stock-risk-entry", "100"); set("stock-fee-target", "110"); set("stock-fee-percent", "0"); set("stock-fee-spread", "0"); set("stock-plan-position-size", "5000"); })()`);
  const feeText = await c.evaluate(text("#stock-fee-output"));
  check("nabtrade: fee panel charges both sides ($29.90 on $5,000)", /\$29\.90/.test(feeText), feeText);
  check("nabtrade: breakeven includes those costs ($100.60)", /\$100\.60/.test(feeText), feeText);
  await c.evaluate(`(() => { const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }; set("stock-risk-account", "100000"); set("stock-risk-percent", "1"); set("stock-risk-entry", "100"); set("stock-risk-invalidation-price", "95"); })()`);
  const riskText = await c.evaluate(text("#stock-risk-output"));
  check("nabtrade: risk panel sizes with the fee for its size (192 shares, $39.90 fees)", /192/.test(riskText) && /\$39\.90/.test(riskText), riskText);
  const nabLinks = `[...document.querySelectorAll("#stock-broker-review a")].filter(a => /nabtrade/.test(a.href)).map(a => a.href)`;
  check("nabtrade: no button before a completed plan", !(await c.evaluate(nabLinks)).length);
  await c.evaluate(`document.getElementById("stock-fee-spread").value = "0.1"`);
  await c.evaluate(stockFillWith(95));
  await sleep(300);
  check("nabtrade: no button with the plan saved but the checklist open", !(await c.evaluate(nabLinks)).length);
  await c.evaluate(`document.querySelectorAll("[data-broker-check]").forEach((_, i) => { const el = document.querySelectorAll("[data-broker-check]")[i]; if (!el.checked) el.click(); })`);
  await c.until(`document.querySelector("#stock-broker-review a")`, "nabtrade button");
  const links = await c.evaluate(nabLinks);
  check("nabtrade: after plan and checklist, one button to nabtrade with no order details", links.length === 1 && links[0] === "https://www.nabtrade.com.au/", links.join());
  check("nabtrade: button opens a new tab safely", await c.evaluate(`(() => { const a = document.querySelector("#stock-broker-review a"); return a.target === "_blank" && /noopener/.test(a.rel); })()`));
  const stored = await c.evaluate(`({ fees: JSON.parse(localStorage.getItem(${JSON.stringify(FEES)})), plans: JSON.parse(localStorage.getItem(${JSON.stringify(PLANS)})) })`);
  const saved = stored.plans.find(p => p.symbol === "ZZA");
  check("nabtrade: saved plan records mode and the fee for its size", saved?.brokerageMode === "nabtrade" && saved?.brokerageFee === 9.95, JSON.stringify(saved));
  const old = stored.plans.find(p => p.symbol === "ZZB");
  check("nabtrade: older plan keeps its saved $5 fee", old?.brokerageFee === 5 && !old?.brokerageMode, JSON.stringify(old));
  check("nabtrade: saving keeps the mode on fee defaults", stored.fees.brokerageMode === "nabtrade" && stored.fees.brokerageFee === 5, JSON.stringify(stored.fees));
  check("nabtrade: Stocks has no page errors", !c.errors.length, c.errors.join(" | "));

  await c.go("planner.html?symbol=ZZA");
  await c.until(`document.getElementById("plan-fee-note")?.textContent`, "planner note");
  check("nabtrade: planner note names nabtrade", /nabtrade/.test(await c.evaluate(text("#plan-fee-note"))), await c.evaluate(text("#plan-fee-note")));

  await c.go("settings.html");
  await c.until(`document.getElementById("broker-fee-mode")?.value === "nabtrade"`, "settings mode");
  check("nabtrade: Settings hides the old $5 behind the table", await c.evaluate(`document.getElementById("broker-fee-brokerage").disabled && document.getElementById("broker-fee-brokerage").value === ""`));
  await c.evaluate(`(() => { const m = document.getElementById("broker-fee-mode"); m.value = "manual"; m.dispatchEvent(new Event("change", { bubbles: true })); const b = document.getElementById("broker-fee-brokerage"); b.value = "12"; document.getElementById("broker-fee-save").click(); })()`);
  const manual = await c.evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(FEES)}))`);
  check("manual: Settings saves mode and fee", manual.brokerageMode === "manual" && manual.brokerageFee === 12, JSON.stringify(manual));
  await c.go("stocks.html");
  await c.until(`document.querySelector('[data-analyse-stock="ZZA"]') && /DELAYED/.test(document.getElementById("stock-source-badge").textContent)`, "stocks rows");
  await c.evaluate(pick("ZZA"));
  await c.until(`document.querySelector(".stock-agent-consensus")`, "cockpit");
  check("manual: Stocks field is editable and shows the manual fee", await c.evaluate(`!${field}.readOnly && Number(${field}.value) === 12`), await c.evaluate(`${field}.value`));
  await c.go("settings.html");
  await c.until(`document.getElementById("broker-fee-mode")?.value === "manual"`, "settings manual");
  await c.evaluate(`document.getElementById("broker-fee-reset").click()`);
  check("reset: back to the nabtrade table", (await c.evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(FEES)})).brokerageMode`)) === "nabtrade");
  check("nabtrade: Settings has no page errors", !c.errors.length, c.errors.join(" | "));
  await c.close();

  const d = await openContext("fresh");
  await d.go("today.html");
  await d.until(`document.getElementById("sq-setup-form")`, "setup form");
  check("nabtrade: Today setup shows the nabtrade table, with no fee to type", !(await d.evaluate(`Boolean(document.getElementById("setup-brokerage"))`)) && /nabtrade/.test(await d.evaluate(`document.querySelector("#sq-setup-form input[readonly]").value`)));
  await d.close();
}

async function scenarioCompanyColumn() {
  const c = await openContext("sevenHours", { width: 1280, height: 1000 });
  await c.go("stocks.html");
  await c.until(`document.querySelector('[data-analyse-stock="ZZA"]')`, "rows");
  await sleep(1200);
  const probe = async width => {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false }, c.sessionId);
    return c.evaluate(`new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
      const panel = document.querySelector(".opportunity-panel");
      const cell = panel.querySelector(".stock-company-cell");
      const button = panel.querySelector("tbody tr button").getBoundingClientRect();
      res({ over: panel.scrollWidth - panel.clientWidth, shortened: cell.scrollWidth > cell.clientWidth, overflowX: getComputedStyle(panel).overflowX, buttonInside: button.right <= panel.getBoundingClientRect().right, title: cell.title, label: cell.getAttribute("aria-label"), text: cell.textContent });
    })))`);
  };
  const name = "Commonwealth Bank of Australia";
  for (const width of [1207, 1280, 1334]) {
    const r = await probe(width);
    check(`Company at ${width}px: shortened, Analyse fully visible, no clip`, r.shortened && r.buttonInside && r.over <= 0, JSON.stringify(r));
  }
  const narrow = await probe(1206);
  check("Company at 1206px: shortened, sideways scroll still available for the last pixel", narrow.shortened && narrow.over === 1 && narrow.overflowX === "auto", JSON.stringify(narrow));
  const r = await probe(1280);
  check("Company at 1280px: full name in tooltip, label and text", r.title === name && r.label === name && r.text === name, JSON.stringify(r));
  check("Company at 1280px: sideways-scroll setting unchanged", r.overflowX === "auto", r.overflowX);
  for (const width of [1335, 1440, 1920]) {
    const wide = await probe(width);
    check(`Company at ${width}px: full name shown, not shortened`, !wide.shortened && wide.over <= 0 && wide.title === name, JSON.stringify(wide));
  }
  await c.close();
}

async function waitForFile(dir, pattern) {
  for (let i = 0; i < 40; i += 1) {
    const hit = readdirSync(dir).find(f => pattern.test(f) && !f.endsWith(".crdownload"));
    if (hit) return join(dir, hit);
    await sleep(150);
  }
  return "";
}

async function scenarioBackup() {
  const c = await openContext("fresh");
  await c.setPrivate("settings.html");
  const STOCK = "sixquant.stocks.tradeJournal.v1";
  const CRYPTO = "sixquant.tradeJournal.v1";
  const stockRows = [{ id: "FIX-1", assetClass: "stock", symbol: "ZZA", mode: "paper", status: "planned", referencePrice: 10, whyNow: "Fixture, with a comma", lessonLearned: "=FORMULA()" }];
  const cryptoRows = [{ id: "FIX-2", symbol: "eth", name: "Fixture ETH", entryDate: "2026-01-02T00:00:00Z", entryPrice: 500, positionSize: 100, signalState: "Watch", reasonEntry: "Fixture crypto", status: "open", mode: "paper" }];
  await c.evaluate(`localStorage.setItem(${JSON.stringify(STOCK)}, ${JSON.stringify(JSON.stringify(stockRows))}); localStorage.setItem(${JSON.stringify(CRYPTO)}, ${JSON.stringify(JSON.stringify(cryptoRows))}); localStorage.setItem("sixquant.githubPat.v1", "fixture-token-not-real")`);
  await c.go("settings.html");
  await c.until(`document.getElementById("data-backup")`, "settings");

  await c.evaluate(`document.getElementById("data-backup").click()`);
  const jsonFile = await waitForFile(c.downloads, /^sixquant-backup-.*\.json$/);
  check("JSON export: file downloads", Boolean(jsonFile), jsonFile);
  const backupText = jsonFile ? readFileSync(jsonFile, "utf8") : "{}";
  const backup = JSON.parse(backupText);
  check("JSON export: holds both record sets", JSON.parse(backup.data?.[STOCK] || "[]")[0]?.symbol === "ZZA" && JSON.parse(backup.data?.[CRYPTO] || "[]")[0]?.id === "FIX-2");
  check("JSON export: GitHub token left out", !backupText.includes("fixture-token-not-real"));

  await c.evaluate(`document.getElementById("data-csv").click()`);
  const csvFile = await waitForFile(c.downloads, /^sixquant-trades-.*\.csv$/);
  check("CSV export: file downloads", Boolean(csvFile), csvFile);
  const csv = csvFile ? readFileSync(csvFile, "utf8") : "";
  check("CSV export: stock and crypto rows, quoted, formula neutralised", /FIX-1/.test(csv) && /FIX-2/.test(csv) && /"Fixture, with a comma"/.test(csv) && /'=FORMULA/.test(csv), csv.split("\r\n").slice(1).join(" / ").slice(0, 200));

  // Restore: a bad file is refused, then the good one replaces changed records.
  const { root } = await cdp("DOM.getDocument", {}, c.sessionId);
  const input = async () => (await cdp("DOM.querySelector", { nodeId: root.nodeId, selector: "#data-import" }, c.sessionId)).nodeId;
  const bad = join(c.downloads, "not-a-backup.json");
  writeFileSync(bad, JSON.stringify({ hello: "world" }));
  await cdp("DOM.setFileInputFiles", { nodeId: await input(), files: [bad] }, c.sessionId);
  await c.until(`/not a SixQuant backup/.test(document.getElementById("data-message").textContent)`, "bad file refusal");
  check("Restore: wrong file refused, confirm stays hidden", await c.evaluate(`document.getElementById("data-import-confirm").hidden`));

  await c.evaluate(`localStorage.setItem(${JSON.stringify(STOCK)}, "[]"); localStorage.setItem(${JSON.stringify(CRYPTO)}, "[]")`);
  await cdp("DOM.setFileInputFiles", { nodeId: await input(), files: [jsonFile] }, c.sessionId);
  await c.until(`!document.getElementById("data-import-confirm").hidden`, "restore confirm");
  check("Restore: says how many records before replacing", /1 stock and 1 crypto/.test(await c.evaluate(text("#data-message"))), await c.evaluate(text("#data-message")));
  await c.evaluate(`document.getElementById("data-import-confirm").click()`);
  await sleep(800);
  await c.until(`document.readyState === "complete"`, "reload after restore");
  check("Restore: records are back", await c.evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(STOCK)}))[0].id === "FIX-1" && JSON.parse(localStorage.getItem(${JSON.stringify(CRYPTO)}))[0].id === "FIX-2"`));
  check("Restore: previous state kept as a restore point", await c.evaluate(`JSON.parse(JSON.parse(localStorage.getItem("sixquant.preImportBackup.v1")).data[${JSON.stringify(STOCK)}]).length === 0`));
  check("Restore: token untouched", (await c.evaluate(`localStorage.getItem("sixquant.githubPat.v1")`)) === "fixture-token-not-real");
  check("Backup and restore: no page errors", !c.errors.length, c.errors.join(" | "));
  await c.close();
}

// ---------- screenshots and column measurements ----------
const measure = `(() => {
  const out = { pageWidth: document.documentElement.scrollWidth, windowWidth: innerWidth };
  document.querySelectorAll(".six-focus-table").forEach(table => {
    const panel = table.closest(".panel").getBoundingClientRect();
    const cells = [...table.querySelectorAll("thead th")];
    const buttons = [...table.querySelectorAll("tbody td:last-child button")];
    const right = buttons.length ? Math.max(...buttons.map(b => b.getBoundingClientRect().right)) : 0;
    const visibleSector = cells.filter(c => getComputedStyle(c).display !== "none").map(c => c.textContent.trim() + ":" + Math.round(c.getBoundingClientRect().width));
    out.table = { panelLeft: Math.round(panel.left), panelRight: Math.round(panel.right), tableWidth: Math.round(table.getBoundingClientRect().width), lastButtonRight: Math.round(right), clippedBy: Math.max(0, Math.round(right - panel.right)), overflowX: getComputedStyle(table.closest(".panel")).overflowX, columns: visibleSector };
  });
  return out;
})()`;
// Finds every window width where the Stocks table is wider than its panel.
async function sweep() {
  const c = await openContext("sevenHours", { width: 1280, height: 1000 });
  await c.go("stocks.html");
  await c.until(`document.querySelector('[data-analyse-stock="ZZA"]')`, "rows");
  await sleep(1500);
  const at = async width => {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false }, c.sessionId);
    return c.evaluate(`new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => { const p = document.querySelector(".opportunity-panel"); const t = p.querySelector("table"); const box = el => { const r = el.getBoundingClientRect(); return [r.left, r.top + scrollY, r.width, r.height].map(Math.round).join(); }; res({ width: innerWidth, panel: p.clientWidth, table: Math.ceil(t.getBoundingClientRect().width), over: p.scrollWidth - p.clientWidth, device: document.documentElement.dataset.device, pageHeight: document.documentElement.scrollHeight, panelHeight: Math.round(p.getBoundingClientRect().height), overflowX: getComputedStyle(p).overflowX, cockpit: box(document.querySelector(".analysis-panel")), menu: box(document.querySelector(".navlinks")), rowHeight: Math.round(p.querySelector("tbody tr").getBoundingClientRect().height) }); })))`);
  };
  const rows = [];
  for (let w = 641; w <= 1700; w += 1) rows.push(await at(w));
  let start = null;
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    if (r.over > 0 && (!prev || prev.over <= 0)) start = r;
    if (prev && prev.over > 0 && (r.over <= 0)) { console.log(`clips from ${start.width}px to ${prev.width}px (panel ${start.panel}-${prev.panel}px, by ${start.over}px down to ${prev.over}px); clear at ${r.width}px (panel ${r.panel}, table ${r.table})`); start = null; }
  });
  if (start) console.log(`clips from ${start.width}px to the end of the sweep`);
  [1180, 1181, 1280, 1334, 1335, 1440].forEach(w => { const r = rows.find(x => x.width === w); console.log(JSON.stringify(r)); });
  if (arg("--sweep-out")) writeFileSync(arg("--sweep-out"), JSON.stringify(rows));
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false }, c.sessionId);
    await sleep(500);
    const shot = await cdp("Page.captureScreenshot", { format: "png" }, c.sessionId);
    writeFileSync(join(SHOTS, "stocks-realistic-1280.png"), Buffer.from(shot.data, "base64"));
  }
  await c.close();
}

async function shots() {
  mkdirSync(SHOTS, { recursive: true });
  const report = {};
  for (const [page, ready] of [["index.html", `document.querySelector('#opportunities-body [data-asset-id]')`], ["stocks.html", `document.querySelector('[data-analyse-stock="ZZA"]')`]]) {
    for (const width of [1280, 1440, 1920, 3413]) {
      const c = await openContext("sevenHours", { width, height: 1000 });
      await c.go(page);
      await c.until(ready, `${page} rows`);
      await sleep(1200);
      const shot = await cdp("Page.captureScreenshot", { format: "png" }, c.sessionId);
      writeFileSync(join(SHOTS, `${page.replace(".html", "")}-${width}.png`), Buffer.from(shot.data, "base64"));
      report[`${page}@${width}`] = await c.evaluate(measure);
      await c.close();
    }
  }
  writeFileSync(join(SHOTS, "measurements.json"), JSON.stringify(report, null, 1));
  Object.entries(report).forEach(([k, v]) => console.log(k, `page ${v.pageWidth}/${v.windowWidth}`, JSON.stringify(v.table)));
}

let chrome;
const profile = mkdtempSync(join(tmpdir(), "sq-workflows-"));
async function main() {
  chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`, "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`,
    "--host-resolver-rules=MAP www.coinspot.com.au 127.0.0.1:9, MAP coinspot.com.au 127.0.0.1:9", "about:blank"], { stdio: "ignore" });
  await connect();
  if (process.argv.includes("--sweep")) { await sweep(); return 0; }
  if (SHOTS) { await shots(); return 0; }
  for (const scenario of [scenarioStaleOneHour, scenarioFreshOneHour, scenarioDemoAndStaleCrypto, scenarioStocks, scenarioBlockedSubmit, scenarioNabtrade, scenarioCompanyColumn, scenarioBackup]) {
    if (arg("--only") && scenario.name !== arg("--only")) continue;
    try { await scenario(); } catch (e) { check(`${scenario.name} finished`, false, e.message); }
  }
  results.forEach(r => console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `\n      ${r.detail}`}`));
  const failed = results.filter(r => !r.pass).length;
  console.log(`\nworkflow checks: ${results.length - failed} passed, ${failed} failed`);
  return failed ? 1 : 0;
}
main().then(code => cleanup(code), e => { console.error(e); cleanup(2); });
function cleanup(code) {
  try { ws?.close(); } catch { /* closing */ }
  try { chrome?.kill(); } catch { /* gone */ }
  setTimeout(() => {
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold it */ }
    process.exit(code);
  }, 800);
}
