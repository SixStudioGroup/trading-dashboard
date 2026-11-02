#!/usr/bin/env node
// SixQuant release verifier. Drives headless Chrome over CDP against a live
// (or given) base URL and runs the device/layout/risk-gate/heartbeat check
// matrix. No npm deps — Node 18+ built-in fetch + WebSocket + child_process.
//
// Usage:   node tools/verify-release.mjs [baseUrl]
// Env:     CHROME_PATH   override Chrome executable
//          CDP_PORT      remote-debugging port (default 9444)
// Exit:    0 all checks pass, 1 any failure, 2 harness error.
//
// Notes for this machine: headless Chrome cannot reach localhost servers
// (loopback blocked for spawned procs) — verify against the live Pages URL.
// Always uses a fresh user-data-dir; reused profiles serve stale cached pages.

import { spawn } from "node:child_process";
import { rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] || "https://sixstudiogroup.github.io/trading-dashboard").replace(/\/$/, "");
const PORT = Number(process.env.CDP_PORT || 9444);
const CHROME = process.env.CHROME_PATH || defaultChrome();
const PAGES = ["index.html", "crypto.html", "today.html", "planner.html", "stocks.html", "journal.html", "alerts.html", "logs.html", "reports.html", "guide.html", "settings.html"];

function defaultChrome() {
  if (process.platform === "win32") {
    return "C:/Program Files/Google/Chrome/Application/chrome.exe";
  }
  if (process.platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
  return "google-chrome";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const record = (name, pass, detail) => results.push({ name, pass: Boolean(pass), detail: detail || "" });

let chromeProc;
const profile = mkdtempSync(join(tmpdir(), "sq-verify-"));

async function waitForCdp() {
  for (let i = 0; i < 25; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); return true; } catch {}
    await sleep(400);
  }
  throw new Error("Chrome CDP endpoint never came up");
}

// Open url in a fresh tab, wait for load, return a send()/evaluate() bound to it.
async function open(url, { width, mobile, settle = 8000 } = {}) {
  const created = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })).json();
  await sleep(settle);
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const target = list.find((t) => t.id === created.id);
  if (!target) throw new Error("target lost: " + url);
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
      setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); reject(new Error("timeout " + method)); } }, 30000);
    });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  });
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  if (width) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 1500, deviceScaleFactor: mobile ? 2 : 1, mobile: Boolean(mobile) });
    await sleep(2200);
  }
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("eval: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const close = () => { try { ws.close(); } catch {} };
  return { send, evaluate, close, targetId: created.id };
}

async function run() {
  chromeProc = spawn(CHROME, [
    "--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`,
    "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore", detached: true });
  chromeProc.unref();
  await sleep(2500);
  await waitForCdp();

  // --- Per-page load + console-clean smoke (desktop) ---
  for (const p of PAGES) {
    let s;
    try {
      s = await open(`${BASE}/${p}`, { settle: 6000 });
      const errs = await s.evaluate(`(() => {
        const out = [];
        // Errors that already happened are not retained; re-probe via a marker:
        return JSON.stringify({ title: document.title, ready: document.readyState });
      })()`);
      const meta = JSON.parse(errs);
      const titled = /SixQuant/.test(meta.title) && !/SixSignal/.test(meta.title);
      record(`load:${p}`, meta.ready === "complete" && titled, `title="${meta.title}"`);
    } catch (e) {
      record(`load:${p}`, false, e.message);
    } finally { s && s.close(); }
  }

  // --- Console error capture on the two terminals (load with Log domain) ---
  for (const p of ["crypto.html", "today.html", "planner.html", "stocks.html"]) {
    const created = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
    await sleep(500);
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const target = list.find((t) => t.id === created.id);
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 0; const pending = new Map(); const errors = [];
    const send = (m, pr = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: pr })); });
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
      if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "exception");
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") errors.push((msg.params.args || []).map((a) => a.value || a.description || "").join(" "));
    });
    await new Promise((res) => ws.addEventListener("open", res));
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Page.navigate", { url: `${BASE}/${p}` });
    await sleep(8000);
    record(`console:${p}`, errors.length === 0, errors.slice(0, 3).join(" | "));
    try { ws.close(); } catch {}
  }

  // --- Desktop layout: device mode, no clipped controls ---
  {
    let s;
    try {
      s = await open(`${BASE}/crypto.html`, { width: 1440, mobile: false });
      const data = JSON.parse(await s.evaluate(`(() => {
        const clip = [];
        const clipAnc = (el) => { let n = el.parentElement; while (n && n !== document.documentElement) { const cs = getComputedStyle(n); if (cs.overflowX === 'hidden' || cs.overflow === 'hidden') return n; n = n.parentElement; } return null; };
        for (const el of document.querySelectorAll('button, a.button-primary, .table-action')) {
          const r = el.getBoundingClientRect(); if (!r.width) continue;
          const a = clipAnc(el); if (!a) continue;
          if (r.right > a.getBoundingClientRect().right + 2) clip.push((el.textContent||'').trim().slice(0,12));
        }
        return JSON.stringify({ device: document.documentElement.dataset.device, clipped: clip.slice(0,6) });
      })()`));
      record("desktop:device-mode", data.device === "desktop", `device=${data.device}`);
      record("desktop:no-clipped-controls", data.clipped.length === 0, data.clipped.join(","));
    } catch (e) { record("desktop:layout", false, e.message); } finally { s && s.close(); }
  }

  // --- Phone layout: no overflow, queues fit, check strip, Analyse visible ---
  for (const p of ["crypto.html", "stocks.html"]) {
    let s;
    try {
      s = await open(`${BASE}/${p}`, { width: 390, mobile: true });
      const data = JSON.parse(await s.evaluate(`(() => {
        const t = document.querySelector('.six-focus-table');
        const ths = t ? t.querySelectorAll('thead th') : [];
        const last = ths.length ? ths[ths.length-1] : null;
        const analyseFits = last ? (last.getBoundingClientRect().right <= 392 && getComputedStyle(last).display !== 'none') : false;
        return JSON.stringify({
          device: document.documentElement.dataset.device,
          scrollW: document.documentElement.scrollWidth,
          queueW: t ? Math.round(t.getBoundingClientRect().width) : 0,
          analyseFits,
          checkVisible: getComputedStyle(document.querySelector('.check-summary') || document.body).display
        });
      })()`));
      record(`phone:${p}:device-mode`, data.device === "phone", `device=${data.device}`);
      record(`phone:${p}:no-overflow`, data.scrollW <= 392, `scrollW=${data.scrollW}`);
      record(`phone:${p}:queue-fits`, data.queueW > 0 && data.queueW <= 392, `queueW=${data.queueW}`);
      record(`phone:${p}:analyse-visible`, data.analyseFits, `analyseFits=${data.analyseFits}`);
      if (p === "crypto.html") record("phone:check-strip", data.checkVisible === "grid", `display=${data.checkVisible}`);
    } catch (e) { record(`phone:${p}`, false, e.message); } finally { s && s.close(); }
  }

  // --- Data truth: a page that renders is not enough, the data must be usable ---
  {
    const feed = await (await fetch(`${BASE}/data/asx-feed.json`, { cache: "no-store" })).json();
    const crypto = await (await fetch(`${BASE}/data/crypto-snapshot.json`, { cache: "no-store" })).json();
    const beat = await (await fetch(`${BASE}/data/heartbeat-crypto.json`, { cache: "no-store" })).json();
    const cryptoAge = (Date.now() - new Date(crypto.lastUpdated).getTime()) / 36e5;
    const SQ = (await import("node:module")).createRequire(import.meta.url)("../sq-core.js");
    const asx = SQ.asxFreshness(feed);
    const flat = feed.assets.filter(a => a.change1d === 0).length;
    record("data:crypto-snapshot-fresh", cryptoAge <= 24, `${cryptoAge.toFixed(1)}h old`);
    record("data:crypto-heartbeat-ok", beat.status === "ok", `status=${beat.status}`);
    record("data:asx-not-stale", !asx.blocks, asx.label);
    record("data:asx-daily-moves-real", flat / feed.assets.length < 0.9, `${flat}/${feed.assets.length} flat`);
    record("data:asx-history-present", (await fetch(`${BASE}/data/asx-history.json`, { cache: "no-store" })).ok);
  }

  // --- Full trade workflow in a throwaway profile: setup, plan, fill, close, review ---
  {
    let s;
    try {
      s = await open(`${BASE}/today.html`, { settle: 5000 });
      await s.evaluate(`(() => {
        document.getElementById('setup-account').value = '50000';
        document.getElementById('sq-setup-form').requestSubmit();
      })()`);
      await sleep(4000);
      const home = await s.evaluate(`JSON.stringify({ mode: localStorage.getItem('sixquant.portalMode.v1'), setupHidden: document.getElementById('sq-setup').hidden, bar: document.getElementById('sq-asx-bar').textContent })`);
      const homeData = JSON.parse(home);
      record("flow:setup-enters-private", homeData.mode === "private" && homeData.setupHidden, home.slice(0, 80));
      s.close();
      s = await open(`${BASE}/planner.html`, { settle: 5000 });
      const plan = JSON.parse(await s.evaluate(`(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        document.querySelector('[data-stock-filter="all"]').click();
        await wait(200);
        document.querySelector('[data-analyse-stock]').click();
        await wait(300);
        const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
        const entry = Number(document.getElementById('plan-entry').value);
        const disabledBlank = document.getElementById('plan-save').disabled;
        const chart = Boolean(document.querySelector('.sq-chart'));
        set('plan-why', 'Verifier test thesis for the workflow');
        set('plan-trigger', 'Verifier trigger');
        set('plan-stop', String(entry * 0.95));
        set('plan-target', String(entry * 1.15));
        await wait(100);
        for (const id of [...document.querySelectorAll('[data-manual-check]')].map(c => c.dataset.manualCheck)) document.querySelector('[data-manual-check="' + id + '"]').click();
        await wait(100);
        const enabled = !document.getElementById('plan-save').disabled;
        document.getElementById('stock-plan-form').requestSubmit();
        await wait(300);
        return JSON.stringify({ disabledBlank, chart, enabled, saved: JSON.parse(localStorage.getItem('sixquant.stocks.tradeJournal.v1') || '[]').length });
      })()`));
      record("flow:plan-blocked-when-blank", plan.disabledBlank === true);
      record("flow:plan-chart-renders", plan.chart === true);
      record("flow:plan-records", plan.enabled && plan.saved === 1, JSON.stringify(plan));
      s.close();
      s = await open(`${BASE}/today.html`, { settle: 5000 });
      const closed = JSON.parse(await s.evaluate(`(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        document.querySelector('[data-toggle-form^="enter-"]').click();
        await wait(150);
        document.querySelector('[data-enter-form]').requestSubmit();
        await wait(150);
        document.querySelector('[data-toggle-form^="close-"]').click();
        await wait(150);
        const f = document.querySelector('[data-close-form]');
        f.exitPrice.value = String(Number(f.closest('.sq-trade').querySelector('dd').textContent.replace('$', '')) * 1.1);
        f.ruleFollowed.value = 'true';
        f.requestSubmit();
        await wait(200);
        const t = JSON.parse(localStorage.getItem('sixquant.stocks.tradeJournal.v1'))[0];
        return JSON.stringify({ status: t.status, r: t.rMultiple, fees: t.feesPaid, mode: t.mode });
      })()`));
      record("flow:close-computes-net-R", closed.status === "closed" && closed.r > 0 && closed.fees > 0 && closed.mode === "paper", JSON.stringify(closed));
      s.close();
      s = await open(`${BASE}/reports.html`, { settle: 6000 });
      const review = await s.evaluate(`document.getElementById('weekly-report-summary')?.textContent || ''`);
      record("flow:review-shows-expectancy", /Expectancy per trade/.test(review) && /too few to judge/.test(review), review.slice(0, 60));
    } catch (e) { record("flow", false, e.message); } finally { s && s.close(); }
  }

  // --- Large monitor: original size, never scaled up ---
  for (const p of ["crypto.html", "stocks.html"]) {
    let s;
    try {
      s = await open(`${BASE}/${p}`, { width: 3400, mobile: false });
      const d = JSON.parse(await s.evaluate(`(() => {
        const main = document.querySelector('main').getBoundingClientRect();
        const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
        return JSON.stringify({ width: main.width, zoom, overflow: document.documentElement.scrollWidth > innerWidth + 2 });
      })()`));
      record(`wide:${p}:not-scaled`, d.zoom === 1, `zoom=${d.zoom}`);
      record(`wide:${p}:original-width`, d.width <= 1420, `width=${Math.round(d.width)}`);
      record(`wide:${p}:no-overflow`, !d.overflow);
    } catch (e) { record(`wide:${p}`, false, e.message); } finally { s && s.close(); }
  }

  // --- Stocks table: the page people actually use ---
  {
    let s;
    try {
      s = await open(`${BASE}/stocks.html`, { width: 1440, mobile: false, settle: 6000 });
      const r = JSON.parse(await s.evaluate(`(async () => {
        const wait = ms => new Promise(res => setTimeout(res, ms));
        const q = document.querySelector('.opportunity-panel').getBoundingClientRect();
        const btn = document.querySelector('[data-analyse-stock]');
        const b = btn.getBoundingClientRect();
        const out = { rows: document.querySelectorAll('.six-focus-table tbody tr').length, analyseOnScreen: b.right <= q.right + 1,
          emptyBanner: getComputedStyle(document.getElementById('stock-heartbeat-warning')).display !== 'none' && !document.getElementById('stock-heartbeat-detail').textContent,
          chips: document.querySelectorAll('[data-region-filter]').length };
        btn.click(); await wait(800);
        const panel = document.getElementById('stock-analysis-panel');
        out.chart = !!panel.querySelector('svg.sq-chart');
        out.stooq = /stooq/i.test(document.querySelector('main').innerText);
        return JSON.stringify(out);
      })()`));
      record("stocks:table-populated", r.rows >= 50, `rows=${r.rows}`);
      record("stocks:analyse-on-screen", r.analyseOnScreen);
      record("stocks:no-empty-banner", !r.emptyBanner);
      record("stocks:no-dead-filters", r.chips === 0, `chips=${r.chips}`);
      record("stocks:cockpit-chart", r.chart);
      record("stocks:no-wrong-source-label", !r.stooq);
    } catch (e) { record("stocks", false, e.message); } finally { s && s.close(); }
  }

  // --- Phone: Today fits ---
  {
    let s;
    try {
      s = await open(`${BASE}/today.html`, { width: 390, mobile: true });
      const w = await s.evaluate(`document.documentElement.scrollWidth`);
      record("phone:today:no-overflow", w <= 392, `scrollW=${w}`);
    } catch (e) { record("phone:today", false, e.message); } finally { s && s.close(); }
  }

  // --- Functional: risk gate blocks, heartbeat present (crypto) ---
  {
    let s;
    try {
      s = await open(`${BASE}/crypto.html`, { settle: 9000 });
      const hb = await s.evaluate(`document.getElementById('feed-heartbeat')?.textContent || ''`);
      record("func:heartbeat-ok", /^OK/.test(hb), `heartbeat="${hb.slice(0,40)}"`);
      const blockMsg = await s.evaluate(`(async () => {
        const btn = document.querySelector('#opportunities-body .table-action');
        if (!btn) return 'NO-ANALYSE';
        btn.click(); await new Promise(r => setTimeout(r, 600));
        document.getElementById('save-plan-journal')?.click();
        await new Promise(r => setTimeout(r, 300));
        return document.getElementById('plan-risk-message')?.textContent || '';
      })()`);
      record("func:gate-blocks-unanswered", /gate question/i.test(blockMsg), `msg="${blockMsg.slice(0,50)}"`);
      const capMsg = await s.evaluate(`(async () => {
        document.querySelectorAll('[data-handoff-check]').forEach(c => { c.checked = true; });
        const size = document.getElementById('plan-size'); const acct = document.getElementById('size-portfolio');
        if (size) size.value = '99999'; if (acct) acct.value = '1000';
        document.getElementById('confirm-plan')?.click();
        await new Promise(r => setTimeout(r, 300));
        return document.getElementById('plan-risk-message')?.textContent || '';
      })()`);
      record("func:gate-blocks-oversize", /cap|exceeds/i.test(capMsg), `msg="${capMsg.slice(0,50)}"`);
    } catch (e) { record("func:gate", false, e.message); } finally { s && s.close(); }
  }
}

function report() {
  const pass = results.filter((r) => r.pass).length;
  const total = results.length;
  const failed = results.filter((r) => !r.pass);
  const lines = [];
  lines.push(`SixQuant verify — ${BASE}`);
  lines.push(`RESULT: ${failed.length === 0 ? "PASS" : "FAIL"} (${pass}/${total})`);
  if (failed.length) {
    lines.push("Failures:");
    for (const f of failed) lines.push(`  ✗ ${f.name}${f.detail ? " — " + f.detail : ""}`);
  }
  console.log(lines.join("\n"));
  return failed.length === 0;
}

let code = 2;
try {
  await run();
  code = report() ? 0 : 1;
} catch (e) {
  console.log(`SixQuant verify — ${BASE}\nRESULT: ERROR — ${e.message}`);
  code = 2;
} finally {
  if (chromeProc && chromeProc.pid) {
    if (process.platform === "win32") {
      try { const { execSync } = await import("node:child_process"); execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: "ignore" }); } catch {}
    } else {
      try { process.kill(-chromeProc.pid); } catch { try { chromeProc.kill(); } catch {} }
    }
  }
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
process.exit(code);
