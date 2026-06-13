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

const BASE = (process.argv[2] || "https://zencloudau.github.io/trading-dashboard").replace(/\/$/, "");
const PORT = Number(process.env.CDP_PORT || 9444);
const CHROME = process.env.CHROME_PATH || defaultChrome();
const PAGES = ["index.html", "stocks.html", "journal.html", "alerts.html", "logs.html", "reports.html", "guide.html", "settings.html"];

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
  for (const p of ["index.html", "stocks.html"]) {
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
      s = await open(`${BASE}/index.html`, { width: 1440, mobile: false });
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
  for (const p of ["index.html", "stocks.html"]) {
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
      if (p === "index.html") record("phone:check-strip", data.checkVisible === "grid", `display=${data.checkVisible}`);
    } catch (e) { record(`phone:${p}`, false, e.message); } finally { s && s.close(); }
  }

  // --- Functional: risk gate blocks, heartbeat present (crypto) ---
  {
    let s;
    try {
      s = await open(`${BASE}/index.html`, { settle: 9000 });
      const hb = await s.evaluate(`document.getElementById('feed-heartbeat')?.textContent || ''`);
      record("func:heartbeat-present", /OK|MISSED|ago|h /.test(hb), `heartbeat="${hb.slice(0,40)}"`);
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
