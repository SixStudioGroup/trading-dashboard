#!/usr/bin/env node
// Browser checks for the Copilot page. The AI server is mocked, so this proves the page's
// behaviour and its display of AI replies, not the real AI connection.
// Usage: node tools/verify-copilot.mjs [--root <dir>] [--shots <dir>]
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

const arg = name => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : ""; };
const ROOT = resolve(arg("--root") || ".");
const SHOTS = arg("--shots");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9471;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/json" };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => { ok ? passed++ : failed++; console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok || !detail ? "" : ` -> ${detail}`}`); };

const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\//, "") || "index.html";
    try {
        const body = readFileSync(join(ROOT, path));
        res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" });
        res.end(body);
    } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const profile = mkdtempSync(join(tmpdir(), "sq-cp-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`, "--no-first-run", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });

let ws;
let id = 0;
const waiting = new Map();
const errors = [];
const cdp = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const n = ++id;
    waiting.set(n, { res, rej, method });
    ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
});
for (let i = 0; i < 40 && !ws; i += 1) {
    try {
        const info = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
        const socket = new WebSocket(info.webSocketDebuggerUrl);
        await new Promise((res, rej) => { socket.addEventListener("open", res); socket.addEventListener("error", rej); });
        ws = socket;
    } catch { await sleep(300); }
}
ws.addEventListener("message", ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && waiting.has(msg.id)) {
        const w = waiting.get(msg.id);
        waiting.delete(msg.id);
        msg.error ? w.rej(new Error(`${w.method}: ${msg.error.message}`)) : w.res(msg.result);
    }
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
});

// Mock of the AI server. The reply carries a script payload to prove it can't become markup.
const MOCK = `(() => {
    const realFetch = window.fetch.bind(window);
    window.__asked = [];
    window.__keySet = localStorage.getItem("mock.ready") === "1";
    window.__chatError = "";
    window.fetch = async (url, options = {}) => {
        if (!String(url).startsWith("https://sixquant-copilot.")) return realFetch(url, options);
        const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
        if ((options.headers || {})["X-Copilot-Code"] !== "right-code") return json({ error: "bad_code" }, 401);
        if (String(url).endsWith("/status")) return json({ ready: window.__keySet });
        if (String(url).endsWith("/setup")) { window.__keySet = true; localStorage.setItem("mock.ready", "1"); return json({ ok: true }); }
        const body = JSON.parse(options.body);
        window.__asked.push(body);
        const lines = window.__chatError
            ? [{ error: window.__chatError }]
            : [{ text: "**My view:** BHP is mid-range, so I would wait.\\n\\n" }, { text: "- Entry on a close above the 20-day high\\n- <img src=x onerror=window.__pwned=1>\\n\\nSource: https://example.com/a?b=1" }, { done: true }];
        return new Response(lines.map(l => JSON.stringify(l)).join("\\n") + "\\n", { headers: { "Content-Type": "application/x-ndjson" } });
    };
})();`;

const { browserContextId } = await cdp("Target.createBrowserContext");
const { targetId } = await cdp("Target.createTarget", { url: "about:blank", browserContextId });
const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
const send = (method, params) => cdp(method, params, sessionId);
await send("Page.enable");
await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: MOCK });
const size = (width, height, mobile = false) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
const go = async (page, wait = 1500) => { await send("Page.navigate", { url: `${BASE}/${page}` }); await sleep(wait); };
const js = async expression => {
    const out = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (out.exceptionDetails) throw new Error(`${expression.slice(0, 60)}: ${out.exceptionDetails.exception?.description}`);
    return out.result.value;
};
const shot = async name => {
    if (!SHOTS) return;
    mkdirSync(SHOTS, { recursive: true });
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, "base64"));
};
const clickText = (sel, text) => js(`[...document.querySelectorAll(${JSON.stringify(sel)})].find(x => x.textContent.trim() === ${JSON.stringify(text)}).click()`);
const fill = (sel, value) => js(`(() => { const x = document.querySelector(${JSON.stringify(sel)}); x.value = ${JSON.stringify(value)}; x.dispatchEvent(new Event("input", { bubbles: true })); })()`);
const submit = sel => js(`document.querySelector(${JSON.stringify(sel)}).requestSubmit()`);

try {
    await size(3413, 1300);
    await go("index.html");
    check("Copilot is the home page", (await js("document.querySelector('h1').textContent")) === "Copilot");
    check("Copilot is first and active in the menu", await js(`(() => { const a = document.querySelector('.navlinks a'); return a.textContent.trim() === 'Copilot' && a.classList.contains('active'); })()`));
    check("Crypto menu item goes to its page", await js(`[...document.querySelectorAll('.navlinks a')].some(a => a.textContent.trim() === 'Crypto' && a.getAttribute('href') === 'crypto.html')`));
    check("status bar shows source, mode and time", /DELAYED|STALE/.test(await js("document.querySelector('#cp-status').textContent")) && /Yahoo/.test(await js("document.querySelector('#cp-status').textContent")));
    const feed = await js("fetch('data/copilot.json').then(r => r.json())");
    const asx = feed.assets.filter(a => a.market === "ASX");
    check("ASX shortlist lists every ASX symbol", (await js("document.querySelectorAll('#cp-rows tr').length")) === asx.length);
    check("shortlist is ranked by score", (await js("document.querySelector('#cp-rows [data-cp-pick]').textContent")) === asx[0].symbol);
    check("backtest result is on the page", /no reliable edge/.test(await js("document.querySelector('#cp-evidence').textContent")));
    check("unlock form shows before any chat", await js("!document.querySelector('#cp-gate').hidden && document.querySelector('#cp-chat').hidden && !!document.querySelector('#cp-gate-form')"));
    await shot("01-home-locked-3413");

    await fill("#cp-gate-value", "wrong");
    await submit("#cp-gate-form");
    await sleep(300);
    check("wrong code is rejected and forgotten", /wrong/.test(await js("document.querySelector('#cp-gate-message').textContent")) && (await js("localStorage.getItem('sixquant.copilot.code.v1')")) === null);
    await fill("#cp-gate-value", "right-code");
    await submit("#cp-gate-form");
    await sleep(300);
    check("right code asks for the API key", /Anthropic API key/.test(await js("document.querySelector('#cp-gate').textContent")));
    await shot("02-connect-key-3413");
    await fill("#cp-gate-value", "sk-ant-mock-key-00000000000000000");
    await submit("#cp-gate-form");
    await sleep(300);
    check("chat opens after the key is connected", await js("document.querySelector('#cp-gate').hidden && !document.querySelector('#cp-chat').hidden"));
    check("access code stays out of backups", await js("!Object.keys(SQ.buildBackup(localStorage).data).includes('sixquant.copilot.code.v1')"));

    await js(`document.querySelector('[data-cp-pick="${asx[0].symbol}"]').click()`);
    await sleep(100);
    check("picking a symbol opens its brief", (await js("document.querySelector('#cp-brief .panel-title').textContent")).startsWith(asx[0].symbol));
    await fill("#cp-account", "20000");
    await fill("#cp-risk", "1");
    await sleep(50);
    const expected = await js(`SQ.sizePosition({ account: 20000, riskPercent: 1, entry: ${asx[0].plan.entry}, stop: ${asx[0].plan.stop}, target: ${asx[0].plan.target}, ...SQ.store.fees(), maxPositionPct: SQ.store.rules().maxPositionPct })`);
    const sized = await js("document.querySelector('#cp-size').textContent");
    check("size uses the nabtrade calculation", sized.includes(expected.units.toLocaleString("en-AU")) && expected.units > 0, sized);

    await fill("#cp-input", "Should I buy BHP?");
    await submit("#cp-form");
    await sleep(300);
    check("reply appears in the chat", /My view:/.test(await js("document.querySelector('#cp-messages').textContent")));
    check("reply formatting works", await js("!!document.querySelector('.cp-msg.assistant strong') && !!document.querySelector('.cp-msg.assistant li') && document.querySelector('.cp-msg.assistant a').rel.includes('noopener')"));
    check("markup in a reply stays as text", await js("!document.querySelector('.cp-msg img') && !window.__pwned"));
    check("account and selected symbol go with the question", await js("window.__asked[0].profile.accountValue !== undefined && window.__asked[0].profile.selectedSymbol === " + JSON.stringify(asx[0].symbol)));
    await shot("03-chat-brief-3413");
    await js("window.__chatError = 'bad_key'");
    await fill("#cp-input", "Another question");
    await submit("#cp-form");
    await sleep(300);
    check("AI failure is stated, not hidden", /rejected the API key/.test(await js("document.querySelector('#cp-chat-message').textContent")));
    await go("index.html");
    check("chat survives a reload", /My view:/.test(await js("document.querySelector('#cp-messages').textContent")));
    await clickText("[data-cp-tab]", "Crypto");
    await sleep(100);
    check("crypto tab lists the crypto symbols", (await js("document.querySelectorAll('#cp-rows tr').length")) === feed.assets.length - asx.length);
    await js(`document.querySelector('#cp-rows [data-cp-pick]').click()`);
    await sleep(100);
    check("crypto brief opens CoinSpot", await js("[...document.querySelectorAll('#cp-brief a')].some(a => a.href.startsWith('https://www.coinspot.com.au/buy/'))"));
    await shot("04-crypto-tab-3413");
    await size(390, 844, true);
    await sleep(300);
    check("no sideways scroll on a phone", await js("document.documentElement.scrollWidth <= window.innerWidth"), String(await js("document.documentElement.scrollWidth")));
    await shot("05-phone");
    await size(3413, 1300);
    await go("crypto.html", 4000);
    check("Crypto page still renders its table", (await js("document.querySelectorAll('#opportunities-body [data-asset-id]').length")) > 0);
    check("Crypto page is active in the menu", await js(`document.querySelector('.navlinks a.active').textContent.trim() === 'Crypto'`));
    await shot("06-crypto-page-3413");
    check("no script errors", errors.length === 0, errors.join(" | ").slice(0, 400));
} finally {
    console.log(`\n${passed} passed, ${failed} failed`);
    chrome.kill();
    server.close();
    ws?.close();
    process.exitCode = failed ? 1 : 0;
}
