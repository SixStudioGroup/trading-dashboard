// scripts/test_calculations.mjs — calculation tests for SixQuant Stocks fee,
// units, returns, breakeven and fee-aware position-size maths.
//
// Run: node scripts/test_calculations.mjs   (exit 0 = pass, non-zero = fail)
//
// The browser carries these formulas in stock-release2.js (calculateNetOutcome)
// and stocks.js (riskPanelValues). Those files are plain <script> includes with
// no module system, so this test re-implements the SAME canonical formulas as
// pure functions AND includes a drift guard that asserts the key formula
// substrings still exist in the browser sources — so the two cannot silently
// diverge. Keep these in sync when the browser maths changes.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Canonical fee / net-outcome maths — mirror of calculateNetOutcome().
// units            = positionSize / entryPrice
// grossProfit      = (targetPrice - entryPrice) * units
// brokerageTotal   = brokerageFee * 2                 (round trip, both sides)
// percentageFees   = positionSize * feePercent/100 * 2
// spreadCost       = positionSize * spreadPercent/100
// totalCosts       = brokerageTotal + percentageFees + spreadCost
// netProfit        = grossProfit - totalCosts
// grossReturnPct   = grossProfit / positionSize * 100
// netReturnPct     = netProfit   / positionSize * 100
// breakevenPrice   = entryPrice + totalCosts / units
// ---------------------------------------------------------------------------
function calculateNetOutcome(input = {}) {
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const entryPrice = Math.max(0, num(input.entryPrice));
  const targetPrice = Math.max(0, num(input.targetPrice));
  const positionSize = Math.max(0, num(input.positionSize));
  const brokerageFee = Math.max(0, num(input.brokerageFee));
  const feePercent = Math.max(0, num(input.feePercent));
  const spreadPercent = Math.max(0, num(input.spreadPercent));
  const units = entryPrice > 0 ? positionSize / entryPrice : 0;
  const grossProfit = targetPrice > 0 ? (targetPrice - entryPrice) * units : 0;
  const brokerageTotal = brokerageFee * 2;
  const percentageFees = positionSize * (feePercent / 100) * 2;
  const spreadCost = positionSize * (spreadPercent / 100);
  const totalCosts = brokerageTotal + percentageFees + spreadCost;
  const netProfit = grossProfit - totalCosts;
  const grossReturnPct = positionSize > 0 ? (grossProfit / positionSize) * 100 : 0;
  const netReturnPct = positionSize > 0 ? (netProfit / positionSize) * 100 : 0;
  const breakevenPrice = units > 0 ? entryPrice + (totalCosts / units) : 0;
  return { units, grossProfit, brokerageTotal, percentageFees, spreadCost, totalCosts, netProfit, grossReturnPct, netReturnPct, breakevenPrice };
}

// ---------------------------------------------------------------------------
// Canonical fee-aware position-size maths — mirror of riskPanelValues().
// maxLoss          = accountValue * riskPercent/100
// perShareRisk     = max(0, entry - invalidation)
// grossShares      = floor(maxLoss / perShareRisk)          (fee-blind)
// perShareVarCost  = entry * (2*feePct + spreadPct)/100
// fixedRoundTrip   = 2 * brokerage
// shares           = floor((maxLoss - fixedRoundTrip) / (perShareRisk + perShareVarCost))
// worstCaseLoss    = shares*perShareRisk + fixedRoundTrip + position*(2*feePct+spreadPct)/100
// ---------------------------------------------------------------------------
function feeAwareSize(input = {}) {
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const accountValue = Math.max(0, num(input.accountValue));
  const riskPercent = Math.max(0, num(input.riskPercent));
  const entryPrice = Math.max(0, num(input.entryPrice));
  const invalidationPrice = Math.max(0, num(input.invalidationPrice));
  const brokerageFee = Math.max(0, num(input.brokerageFee));
  const feePercent = Math.max(0, num(input.feePercent));
  const spreadPercent = Math.max(0, num(input.spreadPercent));
  const maxLossAmount = accountValue * (riskPercent / 100);
  const perShareRisk = Math.max(0, entryPrice - invalidationPrice);
  const grossShares = perShareRisk > 0 ? Math.floor(maxLossAmount / perShareRisk) : 0;
  const perShareVarCost = entryPrice * ((2 * feePercent + spreadPercent) / 100);
  const fixedRoundTrip = 2 * brokerageFee;
  const riskBudgetAfterFixed = maxLossAmount - fixedRoundTrip;
  const denom = perShareRisk + perShareVarCost;
  const estimatedShares = denom > 0 && riskBudgetAfterFixed > 0 ? Math.floor(riskBudgetAfterFixed / denom) : 0;
  const suggestedPositionSize = estimatedShares * entryPrice;
  const roundTripCost = estimatedShares > 0 ? fixedRoundTrip + suggestedPositionSize * ((2 * feePercent + spreadPercent) / 100) : 0;
  const worstCaseLoss = estimatedShares * perShareRisk + roundTripCost;
  return { maxLossAmount, perShareRisk, grossShares, estimatedShares, suggestedPositionSize, roundTripCost, worstCaseLoss };
}

// ---------------------------------------------------------------------------
// Tiny test harness
// ---------------------------------------------------------------------------
let passed = 0, failed = 0;
const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
function check(name, cond, detail = '') {
  if (cond) { passed += 1; }
  else { failed += 1; console.error(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`); }
}
function eq(name, actual, expected, eps = 1e-6) {
  check(name, approx(actual, expected, eps), `expected ${expected}, got ${actual}`);
}

// === Fee / net-outcome tests =============================================
// $10,000 position at $10 entry => 1000 units. Target $11 => gross $1,000.
{
  const r = calculateNetOutcome({ entryPrice: 10, targetPrice: 11, positionSize: 10000, brokerageFee: 5, feePercent: 0, spreadPercent: 0 });
  eq('units = position/entry', r.units, 1000);
  eq('gross profit = (target-entry)*units', r.grossProfit, 1000);
  eq('brokerage is round-trip (x2)', r.brokerageTotal, 10);
  eq('total costs (brokerage only)', r.totalCosts, 10);
  eq('net = gross - costs', r.netProfit, 990);
  eq('gross return %', r.grossReturnPct, 10);
  eq('net return %', r.netReturnPct, 9.9);
  // breakeven: entry + costs/units = 10 + 10/1000 = 10.01
  eq('breakeven price', r.breakevenPrice, 10.01);
}
// Percentage fee per side + spread: 0.1%/side fee, 0.2% spread on $10,000.
{
  const r = calculateNetOutcome({ entryPrice: 10, targetPrice: 11, positionSize: 10000, brokerageFee: 0, feePercent: 0.1, spreadPercent: 0.2 });
  eq('percentage fees = pos*fee%*2', r.percentageFees, 20);   // 10000*0.001*2
  eq('spread cost = pos*spread%', r.spreadCost, 20);          // 10000*0.002
  eq('total costs (pct + spread)', r.totalCosts, 40);
  eq('net = gross - costs', r.netProfit, 960);
  // breakeven: 10 + 40/1000 = 10.04
  eq('breakeven with pct+spread', r.breakevenPrice, 10.04);
}
// Edge: zero position size => no divide-by-zero, all zero, breakeven 0.
{
  const r = calculateNetOutcome({ entryPrice: 10, targetPrice: 11, positionSize: 0, brokerageFee: 5, feePercent: 0.1, spreadPercent: 0.2 });
  eq('zero position: units', r.units, 0);
  eq('zero position: gross', r.grossProfit, 0);
  eq('zero position: returns', r.grossReturnPct, 0);
  eq('zero position: breakeven 0 (no NaN/Infinity)', r.breakevenPrice, 0);
  check('zero position: breakeven finite', Number.isFinite(r.breakevenPrice));
}
// Edge: zero entry price => units 0, breakeven 0, no Infinity.
{
  const r = calculateNetOutcome({ entryPrice: 0, targetPrice: 11, positionSize: 10000, brokerageFee: 5 });
  eq('zero entry: units 0', r.units, 0);
  eq('zero entry: breakeven 0', r.breakevenPrice, 0);
  check('zero entry: breakeven finite', Number.isFinite(r.breakevenPrice));
}
// Edge: no target => gross 0 but costs still apply => net is negative cost.
{
  const r = calculateNetOutcome({ entryPrice: 10, targetPrice: 0, positionSize: 10000, brokerageFee: 5, feePercent: 0, spreadPercent: 0 });
  eq('no target: gross 0', r.grossProfit, 0);
  eq('no target: net = -costs', r.netProfit, -10);
}
// Edge: target below entry (a loss) => negative gross, larger negative net.
{
  const r = calculateNetOutcome({ entryPrice: 10, targetPrice: 9, positionSize: 10000, brokerageFee: 5, feePercent: 0, spreadPercent: 0 });
  eq('loss target: gross negative', r.grossProfit, -1000);
  eq('loss target: net = gross - costs', r.netProfit, -1010);
}
// Edge: negative inputs are clamped to 0 (no negative fees).
{
  const r = calculateNetOutcome({ entryPrice: 10, targetPrice: 11, positionSize: 10000, brokerageFee: -5, feePercent: -1, spreadPercent: -1 });
  eq('negative fees clamped to 0', r.totalCosts, 0);
}

// === Fee-aware position-size tests =======================================
// $50k, 1% risk = $500 budget. Entry $43.20, invalidation $41.50 (risk $1.70/sh).
// Brokerage $5/side, spread 0.10%.
{
  const r = feeAwareSize({ accountValue: 50000, riskPercent: 1, entryPrice: 43.20, invalidationPrice: 41.50, brokerageFee: 5, feePercent: 0, spreadPercent: 0.10 });
  eq('max loss budget', r.maxLossAmount, 500);
  eq('fee-blind shares', r.grossShares, 294);
  eq('fee-aware shares', r.estimatedShares, 281);
  check('fee-aware <= fee-blind', r.estimatedShares <= r.grossShares);
  check('worst-case loss within budget', r.worstCaseLoss <= r.maxLossAmount + 1e-9,
        `worstCase ${r.worstCaseLoss} > budget ${r.maxLossAmount}`);
}
// Heavier fees reduce size further but still stay within budget.
{
  const r = feeAwareSize({ accountValue: 50000, riskPercent: 1, entryPrice: 43.20, invalidationPrice: 41.50, brokerageFee: 20, feePercent: 0.1, spreadPercent: 0.5 });
  check('heavy-fee size smaller', r.estimatedShares < 294);
  check('heavy-fee worst-case within budget', r.worstCaseLoss <= r.maxLossAmount + 1e-9,
        `worstCase ${r.worstCaseLoss} > budget ${r.maxLossAmount}`);
}
// Degenerate: fixed fees exceed the whole risk budget => 0 shares (no negative).
{
  const r = feeAwareSize({ accountValue: 10000, riskPercent: 1, entryPrice: 10, invalidationPrice: 9.5, brokerageFee: 80, feePercent: 0, spreadPercent: 0 });
  eq('fees > budget => 0 shares', r.estimatedShares, 0);
  eq('0 shares => 0 worst-case', r.worstCaseLoss, 0);
}
// Edge: invalidation at/above entry => perShareRisk 0 => 0 shares (no divide-by-zero).
{
  const r = feeAwareSize({ accountValue: 50000, riskPercent: 1, entryPrice: 43.20, invalidationPrice: 43.20, brokerageFee: 5, feePercent: 0, spreadPercent: 0.10 });
  eq('zero per-share risk => 0 fee-blind', r.grossShares, 0);
  // With spread>0 the denom is non-zero, but a stop at entry realises no price
  // risk; the size is whatever the fee budget allows. Assert it stays finite.
  check('zero per-share risk => finite size', Number.isFinite(r.estimatedShares));
}

// === Drift guard: assert the browser sources still carry the key formulas ==
{
  const r2 = readFileSync(path.join(ROOT, 'stock-release2.js'), 'utf8');
  check('stock-release2 keeps round-trip brokerage (x2)', /brokerageFee\s*\*\s*2/.test(r2));
  check('stock-release2 keeps round-trip percentage fee (x2)', /feePercent\s*\/\s*100\)\s*\*\s*2/.test(r2));
  check('stock-release2 keeps breakeven = entry + costs/units', /entryPrice\s*\+\s*\(totalCosts\s*\/\s*units\)/.test(r2));
  const sj = readFileSync(path.join(ROOT, 'stocks.js'), 'utf8');
  check('stocks.js keeps fee-aware denom (perShareRisk + perShareVarCost)', /perShareRisk\s*\+\s*perShareVarCost/.test(sj));
  check('stocks.js keeps fixed round-trip = 2*brokerage', /2\s*\*\s*fees\.brokerageFee/.test(sj));
}

console.log(`\ncalculation tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
